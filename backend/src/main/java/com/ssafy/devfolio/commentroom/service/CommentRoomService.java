package com.ssafy.devfolio.commentroom.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.devfolio.commentroom.CommentRoom;
import com.ssafy.devfolio.commentroom.RoomStatus;
import com.ssafy.devfolio.commentroom.dto.CreateCommentRoomRequest;
import com.ssafy.devfolio.pubsub.RedisSenderService;
import com.ssafy.devfolio.exception.BaseException;
import com.ssafy.devfolio.exception.ErrorCode;
import com.ssafy.devfolio.member.MemberRepository;
import com.ssafy.devfolio.member.domain.Member;
import com.ssafy.devfolio.member.dto.SocketMemberInfo;
import com.ssafy.devfolio.sentence.Sentence;
import com.ssafy.devfolio.utils.property.RedisKeyPrefixProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

import static com.ssafy.devfolio.utils.FunctionExceptionWrapper.wrapper;
import static com.ssafy.devfolio.utils.Utility.splitDocument;

@Service
@RequiredArgsConstructor
public class CommentRoomService {

    private final RedisKeyPrefixProperties keyPrefixProperties;

    private String COMMENT_ROOM_PREFIX;
    private String DOCUMENT_PREFIX;
    private String PIN_CHECK_PREFIX;
    private String MEMBER_ROOM_PREFIX;
    private String PARTICIPANT_PREFIX;
    private final int PIN_NUMBER_DIGITS = 8;

    private final RedisTemplate<String, String> redisTemplate;
    private final ValueOperations<String, String> valueOperations;
    private final HashOperations<String, String, String> hashOperations;
    private final ListOperations<String, String> listOperations;

    private final ObjectMapper objectMapper;
    private final MemberRepository memberRepository;

    private final RedisSenderService redisSenderService;
    private final Map<String, ChannelTopic> channels;

    @PostConstruct
    public void init() {
        COMMENT_ROOM_PREFIX = keyPrefixProperties.getCommentRoom();
        DOCUMENT_PREFIX = keyPrefixProperties.getDocument();
        PIN_CHECK_PREFIX = keyPrefixProperties.getPinCheck();
        MEMBER_ROOM_PREFIX = keyPrefixProperties.getMemberRoom();
        PARTICIPANT_PREFIX = keyPrefixProperties.getParticipant();
    }

    public CommentRoom createCommentRoom(CreateCommentRoomRequest request, Long memberId) throws JsonProcessingException {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BaseException(ErrorCode.MEMBER_NOT_EXIST));
        CommentRoom commentRoom = CommentRoom.createCommentRoom(request, memberId);

        // ????????? ?????? ???????????? ????????? ??????
        commentRoom.setDocument(createDocument(request.getContents()));

        // ????????? ??????
        commentRoom.setPinNumber(createPinNumber(PIN_NUMBER_DIGITS));

        //????????? ?????? ??????
        commentRoom.enterCommentRoom(member.getName());

        // redis??? ????????? ??????
        String commentRoomToString = objectMapper.writeValueAsString(commentRoom);
        valueOperations.set(COMMENT_ROOM_PREFIX + commentRoom.getRoomId(), commentRoomToString);

        // ?????? - ??? ?????? (?????? ????????? ?????? ??? ?????? ?????? ??????)
        listOperations.leftPush(MEMBER_ROOM_PREFIX + memberId, commentRoom.getRoomId());

        // ????????? - ??? ?????? (???????????? ??? ?????? ??????)
        valueOperations.set(PIN_CHECK_PREFIX + commentRoom.getPinNumber(), commentRoom.getRoomId());

        // ????????? ?????? ??????
        listOperations.rightPush(PARTICIPANT_PREFIX + commentRoom.getRoomId(), member.getName());

        return commentRoom;
    }

    public void closeCommentRoom(String commentRoomId, Long memberId) throws JsonProcessingException {
        if (!redisTemplate.hasKey(COMMENT_ROOM_PREFIX + commentRoomId)) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_NOT_EXIST);
        }

        CommentRoom commentRoom = objectMapper.readValue(
                valueOperations.get(COMMENT_ROOM_PREFIX + commentRoomId), CommentRoom.class);

        if (!memberId.equals(commentRoom.getMemberId())) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_ONLY_CLOSED_BY_OWNER_EXCEPTION);
        }
        commentRoom.closeCommentRoom();
        valueOperations.setIfPresent(COMMENT_ROOM_PREFIX + commentRoomId, objectMapper.writeValueAsString(commentRoom));

        // subscriber ?????? ??? ?????? ??????
        redisSenderService.sendRoomUpdateService(commentRoom);
    }

    public CommentRoom getCommentRoom(String pinNumber) throws JsonProcessingException {
        if (!redisTemplate.hasKey(PIN_CHECK_PREFIX + pinNumber)) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_NOT_EXIST);
        }

        String commentRoomId = valueOperations.get(PIN_CHECK_PREFIX + pinNumber);

        return objectMapper.readValue(valueOperations.get(COMMENT_ROOM_PREFIX + commentRoomId), CommentRoom.class);
    }

    public CommentRoom getCommentRoomById(String commentRoomId) throws JsonProcessingException {
        if (!redisTemplate.hasKey(COMMENT_ROOM_PREFIX + commentRoomId)) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_NOT_EXIST);
        }

        return objectMapper.readValue(valueOperations.get(COMMENT_ROOM_PREFIX + commentRoomId), CommentRoom.class);
    }

    private String createPinNumber(int digits) {
        Random random = new Random();
        StringBuilder pinNumber;
        do {
            pinNumber = new StringBuilder();
            for (int i = 0; i < digits; ++i) {
                pinNumber.append(random.nextInt(10));
            }
        } while (redisTemplate.hasKey(PIN_CHECK_PREFIX + pinNumber.toString()));

        return pinNumber.toString();
    }

    private String createDocument(String content) throws JsonProcessingException {
        String documentId = UUID.randomUUID().toString();

        List<String> sentences = splitDocument(content);

        for (String data : sentences) {
            Sentence sentence = Sentence.createSentence(data);
            String sentenceToString = objectMapper.writeValueAsString(sentence);
            hashOperations.put(DOCUMENT_PREFIX + documentId, sentence.getSentenceId(), sentenceToString);
        }

        return documentId;
    }

    public CommentRoom fixRoomTitle(String commentRoomId, String roomTitle, Long memberId) throws JsonProcessingException {
        CommentRoom commentRoom = getCommentRoomById(commentRoomId);

        if (!commentRoom.getMemberId().equals(memberId)) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_ONLY_FIXED_BY_OWNER_EXCEPTION);
        }

        commentRoom.fixRoomTitle(roomTitle);

        valueOperations.setIfPresent(COMMENT_ROOM_PREFIX + commentRoomId, objectMapper.writeValueAsString(commentRoom));

        return commentRoom;
    }

    public CommentRoom fixMemberLimit(String commentRoomId, int memberLimit, Long memberId) throws JsonProcessingException {
        if (memberLimit <= 0) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_INVALID_MEMBER_LIMIT);
        }

        CommentRoom commentRoom = getCommentRoomById(commentRoomId);

        if (!commentRoom.getMemberId().equals(memberId)) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_ONLY_FIXED_BY_OWNER_EXCEPTION);
        }

        commentRoom.fixMemberLimit(memberLimit);

        valueOperations.setIfPresent(COMMENT_ROOM_PREFIX + commentRoomId, objectMapper.writeValueAsString(commentRoom));

        return commentRoom;
    }

    public boolean isClosedRoom(String commentRoomId) throws JsonProcessingException {
        CommentRoom commentRoom = getCommentRoomById(commentRoomId);

        return commentRoom.getStatus().equals(RoomStatus.CLOSED);
    }

    public CommentRoom enterCommentRoom(String pinNumber, String nickname) throws JsonProcessingException {
        CommentRoom commentRoom = getCommentRoom(pinNumber);

        if (commentRoom.getStatus().equals(RoomStatus.CLOSED)) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_CLOSED_EXCEPTION);
        }

        int enterResult = commentRoom.enterCommentRoom(nickname);

        // ????????? ?????? ??????
        valueOperations.setIfPresent(COMMENT_ROOM_PREFIX + commentRoom.getRoomId(), objectMapper.writeValueAsString(commentRoom));

        // ?????? ????????? ?????? ????????? ?????? ??????
        if (enterResult == 1) {
            listOperations.rightPush(PARTICIPANT_PREFIX + commentRoom.getRoomId(), nickname);
        }

        return commentRoom;
    }

    public List<CommentRoom> getMemberRooms(Long memberId) {
        Long size = listOperations.size(MEMBER_ROOM_PREFIX + memberId);

        List<String> commentRoomIds = listOperations.range(MEMBER_ROOM_PREFIX + memberId, 0, size - 1);

        return commentRoomIds.stream()
                .map(wrapper(this::getCommentRoomById))
                .collect(Collectors.toList());
    }

    public void exitCommentRoom(SocketMemberInfo currentSession) throws JsonProcessingException {
        CommentRoom commentRoom = getCommentRoomById(currentSession.getCommentRoomId());
        String nickname = currentSession.getNickname();

        commentRoom.exitCommentRoom(nickname);

        // ????????? ????????? ?????? ??????
        valueOperations.setIfPresent(COMMENT_ROOM_PREFIX + commentRoom.getRoomId(), objectMapper.writeValueAsString(commentRoom));

        // ?????? ?????? publish
        redisSenderService.sendRoomUpdateService(commentRoom, commentRoom.getMember(nickname));
    }

    public void reenterCommentRoom(SocketMemberInfo currentSession) throws JsonProcessingException {
        CommentRoom commentRoom = getCommentRoomById(currentSession.getCommentRoomId());

        // ????????? ?????? ????????? ?????? ?????? ??????
        if (commentRoom == null) {
            return;
        }

        if (commentRoom.getStatus().equals(RoomStatus.CLOSED)) {
            throw new BaseException(ErrorCode.COMMENT_ROOM_CLOSED_EXCEPTION);
        }

        String nickname = currentSession.getNickname();
        commentRoom.enterCommentRoom(nickname);

        // ????????? ?????? ??????
        valueOperations.setIfPresent(COMMENT_ROOM_PREFIX + commentRoom.getRoomId(), objectMapper.writeValueAsString(commentRoom));

        // ?????? ?????? publish
        redisSenderService.sendRoomUpdateService(commentRoom, commentRoom.getMember(nickname));
    }
}

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useHistory } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { MdContentPaste } from 'react-icons/md';
import { FaAngleLeft } from 'react-icons/fa';
import {
  saveRoomInfo,
  resetRoomInfo,
  updateMemberList,
} from '../modules/actions/roomActions';
import { commentSetAction } from '../modules/actions/commentActions';
import { getRoomInfo, closeRoom } from '../api/co-fix';
import { modifyDocuments } from '../api/documents';
import { getDocuments } from '../api/documents';
import {
  documentGetAction,
  documentModifyAction,
  updateCommentExist,
} from '../modules/actions/documentActions';
import { getAllComments, agreeComment } from '../api/comments.js';

// socket
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';

// library
import styled from 'styled-components';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { debounce } from 'lodash';

// containers
import DocumentContainer from '../containers/DocumentContainer';
import CommentContainer from '../containers/CommentContainer';
import RoomSettingButtonContainer from '../containers/RoomSettingButtonContainer';

// components
import OpenViduMain from '../openvidu/OpenViduMain';
import useRoomInfo from '../hook/useRoomInfo';
import useLoginUser from '../hook/useLoginUser';
import CommentForm from '../components/innerCommentElements/CommentForm';
import CalcContentLength from '../containers/mypage/CalcContentLength';

// modal component
import Modal from '../containers/Modal';
import AlertModal from '../components/modal/AlertModal';

// toast
import toast, { Toaster } from 'react-hot-toast';

const localStorage = window.localStorage;

export default function CommonWorkPage({ isCoFixRoom }) {
  const dispatch = useDispatch();
  const history = useHistory();
  const { roomId, documentId, memberId, roomTitle, pinNumber, members } =
    useRoomInfo();
  const user = useLoginUser();
  const [stompClientTest, setStompClientTest] = useState();
  const [isToggle, setIsToggle] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isRoomClosed, setIsRoomClosed] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const scrollRef = useRef(null);
  const sentences = useSelector((state) => {
    return state.document.data;
  });

  const [onFocusedSentence, setOnFocusedSentence] = useState('');

  // socket

  // sentence ?????? -> comment ??????
  const onHandleClickSentence = (sentenceId) => {
    setOnFocusedSentence(sentenceId);
    getAllComments(
      roomId,
      documentId,
      sentenceId,
      (res) => {
        dispatch(commentSetAction(res.data.data));
      },
      () => {},
    );
  };

  // socket ?????????
  const testRequest = (sentenceId, modifiedContent) => {
    modifyDocuments(
      roomId,
      documentId,
      sentenceId,
      {
        modifiedContent: modifiedContent,
      },
      () => {},
      () => {},
    );
  };

  const notifyError = useCallback((nickname) => {
    const id = toast.error(`${nickname}?????? ??????????????????.`);
    setTimeout(() => {
      toast.dismiss(id);
    }, 1000);
  });
  const notifySuccess = useCallback((nickname) => {
    const id = toast.success(`${nickname}?????? ??????????????????.`);
    setTimeout(() => {
      toast.dismiss(id);
    }, 1000);
  });
  // const notifyError = useCallback(
  //   debounce((nickname) => toast.error(`${nickname}?????? ??????????????????.`), 200),
  //   [],
  // );
  // const notifySuccess = useCallback(
  //   debounce((nickname) => toast.success(`${nickname}?????? ??????????????????.`), 200),
  //   [],
  // );

  const connectSocket = () => {
    const socket = new SockJS('https://k4b104.p.ssafy.io/api/wss');
    const stompClient = Stomp.over(socket);
    setStompClientTest(stompClient);
    stompClient.connect(
      {
        nickname: localStorage.getItem('nickName') || 'anonymous',
        commentRoomId: roomId,
      },
      (frame) => {
        stompClient.subscribe('/room/' + roomId, (res) => {
          const body = JSON.parse(res.body);
          const modifiedSentence = body.sentence; // ??????????????? ??????
          const updatedMember = body.updatedMember;

          // -- ??????, ?????? ??????
          if (updatedMember) {
            if (updatedMember.online) {
              notifySuccess(updatedMember.nickname);
            } else {
              notifyError(updatedMember.nickname);
            }
          }

          // -- ??? ??????, ?????? ???????????? ??????
          if (body.status === 'CLOSED') {
            stompClient.disconnect(() => {}, {});
            setIsRoomClosed((prev) => !prev);
            setTimeout(() => {
              setIsRoomClosed((prev) => !prev);
              history.push('/');
            }, 2000);
            return;
          } else {
            if (body.updatedType === 'SENTENCE') {
              // ?????? ??????
              ModifyActionHandler(modifiedSentence);
              dispatch(updateCommentExist(modifiedSentence));
            } else if (body.updatedType === 'ROOM') {
              // ?????? ??????
              dispatch(updateMemberList(body.members));
            }
            return body;
          }
        });
      },
    );
  };

  const onHandleDebounce = debounce((modifiedSentence) => {
    dispatch(documentModifyAction(modifiedSentence));
  }, 500);

  const ModifyActionHandler = (modifiedSentence) => {
    onHandleDebounce(modifiedSentence);
  };

  const disconnectSocket = (stompClient) => {
    stompClient.disconnect(() => {});
  };

  const onHandleScrollToBottom = () => {
    if (!scrollRef || !scrollRef.current) {
      return;
    }

    scrollRef.current.scrollToBottom({
      behavior: 'smooth',
    });
  };

  const onHandleClickLayout = () => {
    setIsToggle((prev) => !prev);
  };

  // redux??? ?????????????????? documentReducer ????????????
  useEffect(() => {
    if (localStorage.getItem('nickName')) {
      getDocuments(
        roomId,
        documentId,
        (response) => {
          dispatch(documentGetAction(response.data.data));
        },
        () => {},
      );
      connectSocket();
    } else {
      history.push('/');
      alert('????????? ???????????????.');
    }
    return () => {
      localStorage.removeItem('nickName');
      stompClientTest && stompClientTest.disconnect();
    };
  }, []);

  const onPinPasteHandler = () => {
    const pinNum = document.getElementById('pinNum');
    pinNum.select();
    document.execCommand('copy');
    AlertModalToggleHandler('??????????????? ???????????? ?????? ???????????????.');
  };

  const AlertModalToggleHandler = (message) => {
    setAlertMessage(message);
    setIsAlertModalOpen(!isAlertModalOpen);
  };

  const gotoBack = () => {
    stompClientTest.disconnect();
    history.push('/');
  };

  useEffect(() => {
    return () => {
      isCoFixRoom && stompClientTest.disconnect();
    };
  }, [isCoFixRoom]);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Modal
        width="fit-content"
        height="320px"
        isModalOpen={isAlertModalOpen}
        ModalToggleHandler={() => AlertModalToggleHandler('')}
      >
        <AlertModal
          PropsText={alertMessage}
          PropsComfirmHandler={() => AlertModalToggleHandler('')}
        />
      </Modal>
      <Modal
        width="fit-content"
        height="320px"
        isModalOpen={isRoomClosed}
        ModalToggleHandler={() => setIsRoomClosed((prev) => !prev)}
      >
        <AlertModal PropsText={'?????? ????????? ?????????????????????.'} />
      </Modal>
      <S.CommonWorkPage oncopy="return false" oncut="return false">
        <Prev onClick={gotoBack} />
        <S.HeaderSpace isToggle={isToggle}>
          <S.HeaderLeft>
            <S.HeaderTitle>?????? : {roomTitle}</S.HeaderTitle>
          </S.HeaderLeft>
          {user.authenticated && memberId === user.credentials.member.id ? (
            <S.HeaderCenter>
              PIN : &nbsp;
              <S.HeaderInput id="pinNum" value={pinNumber} readOnly />
              <S.PasteIcon onClick={onPinPasteHandler} />
            </S.HeaderCenter>
          ) : (
            <div></div>
          )}
          <S.HeaderRight
            stompClientTest={stompClientTest}
            disconnectSocket={disconnectSocket}
          />
        </S.HeaderSpace>
        <S.UsableSpace isToggle={isToggle}>
          <S.LeftSide>
            <Scrollbars style={{ width: '100%', height: '100%' }}>
              <DocumentContainer
                sentences={sentences}
                testRequest={testRequest}
                onHandleClickSentence={onHandleClickSentence}
                stompClientTest={stompClientTest}
                onFocusedSentenceId={onFocusedSentence}
              />
            </Scrollbars>
            {/* <CalcContentLength
              datas={sentences}
              splitPosX={800}
              windowWidthSize={1920}
            /> */}
          </S.LeftSide>
          <S.RightSide>
            <Scrollbars
              ref={scrollRef}
              style={
                onFocusedSentence
                  ? {
                      width: '100%',
                      height: '80%',
                    }
                  : { width: '100%', height: '100%' }
              }
            >
              <CommentContainer
                sentenceId={onFocusedSentence}
                onHandleClickSentence={onHandleClickSentence}
                onHandleScrollToBottom={onHandleScrollToBottom}
              />
            </Scrollbars>
            {onFocusedSentence ? (
              <S.CommentFormWrapper>
                <CommentForm
                  sentenceId={onFocusedSentence}
                  onHandleClickSentence={onHandleClickSentence}
                  onHandleScrollToBottom={onHandleScrollToBottom}
                />
              </S.CommentFormWrapper>
            ) : null}
          </S.RightSide>
        </S.UsableSpace>
        {/* <Participant /> */}
        <OpenViduMain
          isToggle={isToggle}
          setIsToggle={onHandleClickLayout}
          roomTitle={roomTitle}
          pinNumber={pinNumber}
        />
      </S.CommonWorkPage>
    </>
  );
}

const Prev = styled(FaAngleLeft)`
  font-size: 55px;
  color: #5f5f5f;
  position: absolute;
  top: 2%;
  left: 1%;
  cursor: pointer;
  z-index: 2;
`;

const S = {
  CommonWorkPage: styled.div`
    width: 100%;
    height: 100%;
    /* padding-top: 86px; */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(to bottom, #ffffeb, #ffcbee);
    padding: 0;
    padding-bottom: 30px;
    animation-duration: 1s;
    animation-name: fadeInUp;
    @keyframes fadeInUp {
      from {
        transform: translate3d(0, 50px, 0);
        opacity: 0;
      }

      to {
        transform: translate3d(0, 0, 0);
        opacity: 1;
      }
    }
  `,
  HeaderSpace: styled.div`
    width: 100%;
    height: 10%;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    padding: 0 0%;
    transition: all 0.7s ease-in-out;
    transform: ${({ isToggle }) =>
      isToggle ? 'translateX(-11%)' : 'translateX(0px)'};
    z-index: 1;
  `,
  HeaderTitle: styled.span`
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    border-radius: 20px;
    box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.1);
    padding: 10px 30px;
    font-family: 'S-CoreDream-6Bold';
    font-size: 1.2rem;
  `,
  HeaderRight: styled(RoomSettingButtonContainer)`
    display: flex;
    justify-content: center;
    align-items: center;
  `,
  HeaderCenter: styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    border-radius: 20px;
    box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.1);
    padding: 10px 30px;
    font-family: 'S-CoreDream-6Bold';
    font-size: 1.2rem;
  `,
  HeaderInput: styled.input`
    width: 100px;
    font-family: 'S-CoreDream-6Bold';
    font-size: 1.2rem;
  `,
  PasteIcon: styled(MdContentPaste)`
    margin-left: 5px;
    width: 24px;
    height: 24px;
    transition: all 0.2s ease-in-out;
    &:hover {
      color: #907b7b;
      transform: scale(1.1);
    }
  `,
  HeaderLeft: styled.div``,
  UsableSpace: styled.div`
    width: 90%;
    height: 90%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    transition: all 0.7s ease-in-out;
    transform: ${({ isToggle }) =>
      isToggle ? 'translateX(-11%)' : 'translateX(0)'};
  `,
  LeftSide: styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-basis: 55%;
    max-width: 60%;
    box-shadow: 0 0 30px #dddddd;
    border-radius: 20px;
    overflow: hidden;
    background-color: white;
    padding: 20px;
    padding-right: 0;
    height: 100%;
    margin-right: 2%;
  `,
  RightSide: styled.div`
    flex-basis: 25%;
    max-width: 35%;
    box-shadow: 0 0 30px #dddddd;
    border-radius: 20px;
    overflow: hidden;
    background-color: white;
    height: 100%;
  `,
  CommentFormWrapper: styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 20%;
    width: 100%;
  `,
};

import React from 'react';
import { useSelector } from 'react-redux';

// library
import styled from 'styled-components';
// import Scrollbar from 'react-scrollbars-custom';
import { Scrollbars } from 'react-custom-scrollbars-2';

// containers
import Participant from '../containers/mypage/Participant';
import DocumentContainer from '../containers/DocumentContainer';
import CommentContainer from '../containers/CommentContainer';

// components
import CalcContentLength from '../containers/mypage/CalcContentLength';

export default function CommonWorkPage() {
  // redux에 저장되어있는 documentReducer 가져오기

  return (
    <S.CommonWorkPage>
      <S.UsableSpace>
        <S.LeftSide>
          <Scrollbars style={{ width: '100%', height: '100%' }}>
            <DocumentContainer />
          </Scrollbars>
        </S.LeftSide>
        <S.RightSide>
          <Scrollbars style={{ width: '100%', height: '100%' }}>
            <CommentContainer data={testData} />
          </Scrollbars>
        </S.RightSide>
      </S.UsableSpace>
      <Participant />
    </S.CommonWorkPage>
  );
}

const S = {
  CommonWorkPage: styled.div`
    width: 100%;
    height: 100%;
    padding-top: 86px;
    display: flex;
    justify-content: center;
    align-items: center;
  `,
  UsableSpace: styled.div`
    width: 80%;
    height: 90%;
    display: flex;
    justify-content: space-evenly;
  `,
  LeftSide: styled.div`
    flex-basis: 55%;
    box-shadow: 0 0 30px #dddddd;
    border-radius: 20px;
    overflow: hidden;
  `,
  RightSide: styled.div`
    flex-basis: 35%;
    box-shadow: 0 0 30px #dddddd;
    border-radius: 20px;
    overflow: hidden;
  `,
};

const testData = [
  {
    id: 0,
    avatar:
      'https://www.pikpng.com/pngl/m/357-3577415_free-png-download-cat-cute-png-images-background.png',
    nickname: '비와 당신',
    comment: '지금 이 순간, 마법처럼 날 묶어왔던 사슬을 벗어던진다.',
  },
  {
    id: 1,
    avatar:
      'https://www.pikpng.com/pngl/m/357-3577415_free-png-download-cat-cute-png-images-background.png',
    nickname: '비와 당신',
    comment:
      'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cumque , e.',
  },
  {
    id: 2,
    avatar:
      'https://www.pikpng.com/pngl/m/357-3577415_free-png-download-cat-cute-png-images-background.png',
    nickname: '비와 당신',
    comment:
      'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cumque , e.',
  },
  {
    id: 3,
    avatar:
      'https://www.pikpng.com/pngl/m/357-3577415_free-png-download-cat-cute-png-images-background.png',
    nickname: '비와 당신',
    comment:
      'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cumque , e.Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cumque , e.',
  },
];

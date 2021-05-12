import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import InputForm from '../../components/common/InputForm';
import BasicButton from '../../components/common/BasicButton';
const ContainerFrame = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  padding-top: 86px;
  padding-bottom: 50px;
  /* justify-content: center;
  align-items: center; */
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
`;
const InputLabel = styled.div`
  font-size: 55px;
  font-weight: bold;
  font-family: 'Samlip';
  color: black;
  margin: 10px;
  word-break: keep-all;
  text-align: center;
`;
const LeftFrame = styled.div`
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding-top: 100px;
  padding-bottom: 30px;
`;

const RightFrame = styled.div`
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-top: 50px;
`;
const TextArea = styled.textarea`
  border: none;
  width: 90%;
  margin: 0 auto;
  height: 80%;
  font-size: 15px;
  padding: 20px;
  font-family: 'Roboto';
  border-radius: 15px;
  box-shadow: 3px 6px 3px rgba(0, 0, 0, 0.1);
  resize: none;
  &:focus {
    outline: none;
  }
`;
export default function UploadText({ onHandleSubmit, value, onValueChange }) {
  return (
    <ContainerFrame>
      <LeftFrame>
        <InputLabel>첨삭할 파일을</InputLabel>
        <InputLabel>입력해주세요.</InputLabel>
      </LeftFrame>
      <RightFrame>
        <TextArea
          value={value}
          onChange={(e) => {
            onValueChange(e);
          }}
          autoCapitalize={'none'}
          autoFocus={'off'}
          required={true}
        />
        <BasicButton
          text={'시작하기'}
          width={400}
          fontSize={20}
          height={50}
          backgroundColor={'#FE8D8D'}
          margin={30}
          onClickHandler={onHandleSubmit}
        ></BasicButton>
      </RightFrame>
    </ContainerFrame>
  );
}
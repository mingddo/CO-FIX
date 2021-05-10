// Roll : Comment 컨테이너에서 comment를 작성하는 폼.

import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const S = {
  CommentForm: styled.div`
    display: flex;
    flex-direction: column;
    width: 400px;
    height: 150px;
    padding: 0 20px;
  `,
  FormLabelBox: styled.div`
    display: flex;
    align-items: center;
    padding-left: 10px;
    flex-basis: 20%;
  `,
  FormLabel: styled.label.attrs({
    for: 'comment',
  })`
    padding-left: 10px;
    font-family: 'Samlip';
    font-size: 16px;
    color: #727272;
  `,
  FormInputBox: styled.div`
    flex-basis: 80%;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  FormInput: styled.textarea.attrs({
    type: 'text',
    id: 'comment',
  })`
    padding: 12px 10px;
    resize: none;
    border: 3px solid #aaaaaa;
    border-radius: 10px;
    outline: none;
    width: 100%;
    height: 80%;
    font-family: 'Samlip';
    overflow: hidden;
    font-size: 16px;
  `,
};

function CommentForm({ onSubmit }) {
  const inputRef = useRef(null);

  useEffect(() => {}, []);
  return (
    <S.CommentForm>
      <S.FormLabelBox>
        {/* 새로운 아이콘을 주시오. */}
        <span style={{ color: '#aaaaaa' }}>🗨</span>
        <S.FormLabel>의견을 남겨주세요.</S.FormLabel>
      </S.FormLabelBox>
      <S.FormInputBox>
        <S.FormInput ref={inputRef} />
      </S.FormInputBox>
    </S.CommentForm>
  );
}

export default CommentForm;

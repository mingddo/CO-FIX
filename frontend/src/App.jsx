import React, { useEffect, useState } from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import AnimatedCursor from 'react-animated-cursor';

// pages
import Home from './views/Home';
import MyPage from './views/MyPage';
import MyPageList from './views/MyPageList';
import Create from './views/Create';
import Join from './views/Join';
import TestArea from './views/TestArea';

// container
import NavBar from './containers/NavBar';

// components
// import { PrivateRoute } from './utils/PrivateRoute';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 알기
  const CheckAuthentication = () => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(user ? true : false);
  };

  useEffect(() => {
    CheckAuthentication();
    console.log(`AuthCheckTriger isLoggedIn = `, isLoggedIn);
  }, [isLoggedIn]);

  return (
    <>
      <NavBar isLoggedIn={isLoggedIn} />
      {/* <AnimatedCursor
        innerSize={20}
        outerSize={20}
        color="220, 110, 90"
        outerAlpha={0.1}
        innerScale={0.8}
        outerScale={4}
      /> */}
      <Switch>
        <Route path="/" component={Home} exact />
        <Route path="/mypagelist" component={MyPageList} />
        <Route path="/mypage" component={MyPage} />
        <Route path="/create" component={Create} />
        <Route path="/join" component={Join} />
        <Route path="/testArea" component={TestArea} />
        {/* <PrivateRoute /> */}
      </Switch>
    </>
  );
}

export default withRouter(App);

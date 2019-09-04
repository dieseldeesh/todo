import React from "react";
import { CSSTransition } from "react-transition-group";

export const Slide: React.SFC<{ show: boolean }> = ({ show, children }) => (
    <CSSTransition in={show} timeout={600} classNames="slide" unmountOnExit={true}>
        {children}
    </CSSTransition>
);

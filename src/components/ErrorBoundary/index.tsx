import React from "react";
import { Translation } from "react-i18next";

import { USERDATAKEY } from "@helpers/user";
import { TOKENKEY } from "@helpers/token";

import "./style.css";

export class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
    constructor(props: any) {
        super(props);

        this.state = {
            hasError: false,
        };
    }

    static getDerivedStateFromError(error: unknown) {
        return { hasError: true };
    }

    reset() {
        window.localStorage.removeItem(TOKENKEY);
        window.localStorage.removeItem(USERDATAKEY);

        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error">
                    <Translation>{ t => (
                        <div className="error--container">
                            <div className="error--container__title">{ t("error-boundary.error") }</div>

                            <button onClick={ this.reset }>{ t("error-boundary.reset") }</button>
                        </div>
                    )}</Translation>
                </div>
            );
        }

        return this.props.children;
    }
}

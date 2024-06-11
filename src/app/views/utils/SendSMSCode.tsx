import React, { useEffect, useRef, useState } from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import { Button, Dimmer, Grid, Loader, Message, Segment } from 'semantic-ui-react';
import utilClient from './client/UtilClient';
import { AliyunCaptchaNewPreparationResp, AliyunCaptchaPreparationResp, RecaptchaPreparationResp } from './client/types';
import AliyunCaptcha, { AliyunAuthResponse, AliyunCaptchaRefType } from './AliyunCaptcha';
import AliyunCaptchaNew from "./AliyunCaptchaNew";
(window as typeof window & { recaptchaOptions: any }).recaptchaOptions = {
    useRecaptchaNet: true,
};
enum States {
    ERROR = -1,
    UNLOADED = 1, //初始化
    LOADING = 2, //preparation中
    LOADED = 3, //sitekey获取完成
    RECAPTCHA_LOADING = 4, //加载recaptcha中
    RECAPTCHA_LOADED = 5, //recaptcha加载完成
    AUTHED = 6, //已经经过了reCaptcha认证
    CODE_SENDING = 7, //正在发送验证码
    CODE_SENDED = 8, //验证码已发送
    CODE_ERROR = 9,//验证码发送错误
};
const SendSMSCodeDialog: React.FC<React.PropsWithChildren<{ phone: string; mustNotUse: boolean; onClose: () => void }>> = ({ phone, mustNotUse, onClose }) => {
    const [captchaPrep, setCaptchaPrep] = useState<AliyunCaptchaPreparationResp | RecaptchaPreparationResp | AliyunCaptchaNewPreparationResp | null>(null);
    const [state, setState] = useState<States>(States.UNLOADED);
    const [authResult, setAuthResult] = useState<string | AliyunAuthResponse | null>(null);
    const [message, setMessage] = useState<string>("");
    const [sended, setSended] = useState(false);
    const recaptchaRef = useRef<ReCAPTCHA | any>();
    const aliyunRef = useRef<AliyunCaptchaRefType>(null);
    useEffect(() => {
        (async () => {
            switch (state) {
                case States.UNLOADED:
                    setState(States.LOADING);
                    utilClient.recaptchaPreparation().then(resp => {
                        setCaptchaPrep(resp);
                        setState(States.LOADED);
                    }).catch(() => {
                        setState(States.ERROR);
                    });
                    break;
                case States.LOADED:
                    setState(States.RECAPTCHA_LOADING);
                    break;
            };
        })();
    }, [state]);
    const sendCode = async (currAuthResult?: string) => {
        setSended(true);
        setState(States.CODE_SENDING);
        let resp = await utilClient.sendSMSCode(phone, currAuthResult || authResult, mustNotUse);
        setMessage(resp.message);
        if (resp.code === -1) setState(States.CODE_ERROR);
        else setState(States.CODE_SENDED);
        if (recaptchaRef.current) recaptchaRef.current!.reset();
        else if (aliyunRef.current) aliyunRef.current!.reset();
    };
    return <div>
        <Segment>
            {(state === States.LOADING || state === States.RECAPTCHA_LOADING) && <Dimmer active>
                <Loader></Loader></Dimmer>}
            {state >= States.RECAPTCHA_LOADING && <div>
                <Grid columns="3" centered>
                    <Grid.Column>
                        <Grid columns="1">
                            <Grid.Column style={{ minHeight: "70px" }}>
                                {captchaPrep?.provider === "recaptcha" && <ReCAPTCHA
                                    ref={recaptchaRef}
                                    sitekey={captchaPrep.site_key}
                                    asyncScriptOnLoad={() => setState(States.RECAPTCHA_LOADED)}
                                    onChange={token => {
                                        // setToken(token);
                                        setAuthResult(token);
                                        setState(States.AUTHED);

                                    }}
                                ></ReCAPTCHA>}
                                {captchaPrep?.provider === "aliyun" && <AliyunCaptcha
                                    ref={aliyunRef}
                                    appKey={captchaPrep.appKey}
                                    scene={captchaPrep.scene}
                                    onSuccess={resp => {
                                        setAuthResult(resp);
                                        setState(States.AUTHED);
                                    }}
                                    onSuccessLoad={() => setState(States.RECAPTCHA_LOADED)}
                                ></AliyunCaptcha>}
                                {captchaPrep?.provider === "aliyun2" && <AliyunCaptchaNew
                                    prefix={captchaPrep.prefix}
                                    scene={captchaPrep.sceneId}
                                    onSuccessLoad={() => setState(States.RECAPTCHA_LOADED)}
                                    onSuccess={resp => {
                                        setAuthResult(resp);
                                        setState(States.AUTHED);
                                        // 阿里云2的验证成功了可以直接发送
                                        sendCode(resp);
                                    }}
                                    retrying={sended}
                                ></AliyunCaptchaNew>
                                }
                            </Grid.Column>

                            <Grid.Column>
                                <Button color="green" onClick={onClose}>
                                    关闭
                                </Button>
                                {(state >= States.AUTHED) && (captchaPrep?.provider !== "aliyun2") && <Button color="green" loading={state === States.CODE_SENDING} onClick={() => sendCode()}>
                                    {!sended ? "发送验证码" : "重发验证码"}
                                </Button>}
                            </Grid.Column>
                        </Grid>
                    </Grid.Column>
                </Grid>
                {state >= States.CODE_SENDED && <Message success={state === States.CODE_SENDED} error={state === States.CODE_ERROR}>
                    {message}
                </Message>}
            </div>}
        </Segment>
    </div>;
}

export default SendSMSCodeDialog;

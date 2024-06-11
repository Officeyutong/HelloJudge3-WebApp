import React, { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { showErrorModal } from "../../dialogs/Dialog";
import { Button } from "semantic-ui-react";


interface AliyunCaptchaNewRefType {
    reset: () => void;
}

interface AliyunCaptchaNewProps {
    prefix: string;
    scene: string;
    onSuccessLoad: () => void;
    onSuccess: (resp: string) => void;
    retrying: boolean;
};

const ALIYUN_CAPTCHA2_ID = "main-aliyun-captcha2";
const ALIYUN_CAPTCHA2_BUTTON_ID = "button-aliyun-captcha2";
const AliyunCaptchaNew = ({ prefix, scene, onSuccessLoad, onSuccess, retrying }: AliyunCaptchaNewProps, ref: React.Ref<AliyunCaptchaNewRefType>) => {
    const functionRef = useRef<{ load: () => void; success: (resp: string) => void }>();
    useLayoutEffect(() => {
        functionRef.current = {
            load: onSuccessLoad,
            success: onSuccess
        };
    }, [onSuccess, onSuccessLoad]);
    useEffect(() => {
        let obj: any;
        try {
            (window as any).initAliyunCaptcha({
                SceneId: scene,
                prefix,
                mode: "popup",
                element: `#${ALIYUN_CAPTCHA2_ID}`,
                button: `#${ALIYUN_CAPTCHA2_BUTTON_ID}`,
                language: "cn",
                region: "cn",
                getInstance(inst: any) {
                    // setCaptchaObj(inst);
                    console.log(inst);
                    obj = inst;
                },
                captchaVerifyCallback(params: string) {
                    functionRef.current?.success(params);
                    return {
                        captchaResult: true
                    };
                }
            })
            functionRef.current?.load();
        } catch (e) {
            showErrorModal(`加载验证码失败: ${e}`);
            throw e;
        }
        return () => obj.destroyCaptcha();
    }, [scene, prefix]);
    return <>
        <div id={ALIYUN_CAPTCHA2_ID}></div>
        <Button id={ALIYUN_CAPTCHA2_BUTTON_ID} color="blue">{retrying ? "重发短信" : "点此发送短信"}</Button>
    </>;

};
export type { AliyunCaptchaNewRefType }
export default forwardRef<AliyunCaptchaNewRefType, AliyunCaptchaNewProps>(AliyunCaptchaNew);

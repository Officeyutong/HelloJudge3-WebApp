import React, { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { showErrorModal } from "../../dialogs/Dialog";

interface AliyunAuthResponse {
    sessionId: string;
    token: string;
    sig: string;
};

interface AliyunCaptchaRefType {
    reset: () => void;
}

interface AliyunCaptchaProps {
    appKey: string;
    scene: string;
    onSuccessLoad: () => void;
    onSuccess: (resp: AliyunAuthResponse) => void;
};

const CAPTCHA_ID = "main-aliyun-captcha";

const AliyunCaptcha = ({ appKey, scene, onSuccess, onSuccessLoad }: AliyunCaptchaProps, ref: React.Ref<AliyunCaptchaRefType>) => {
    const [captchaObj, setCaptchaObj] = useState<{ reset: () => void; } | null>(null);
    const functionRef = useRef<{ load: () => void; success: (resp: AliyunAuthResponse) => void }>();
    useLayoutEffect(() => {
        functionRef.current = {
            load: onSuccessLoad,
            success: onSuccess
        };
    }, [onSuccess, onSuccessLoad]);
    useEffect(() => {
        if (captchaObj !== null) {
            const func = () => captchaObj.reset();
            if (typeof ref === "function") ref({ reset: func });
            else if (ref !== null) (ref as any).current = ({ reset: func });
        }
    }, [ref, captchaObj]);
    useEffect(() => {
        (window as any).AWSC.use("nc", (state: any, module: any) => {
            // 初始化
            console.log(appKey, scene, functionRef.current, module, state);
            const resp = module.init({
                appkey: appKey,
                scene: scene,
                renderTo: CAPTCHA_ID,
                success: (data: AliyunAuthResponse) => {
                    functionRef.current!.success(data);
                },
                fail: (failCode: any) => {
                    showErrorModal(`验证失败: ${failCode}`)
                },
                error: (err: any) => {
                    showErrorModal(`无法加载阿里云验证码: ${err}`)
                }
            });
            setCaptchaObj(resp as any);
            functionRef.current!.load();
        });
        return () => {
            const newElem = document.createElement("div");
            document.getElementById(CAPTCHA_ID)?.replaceWith(newElem);
            newElem.id = CAPTCHA_ID;
        }
    }, [appKey, scene]);

    return <div id={CAPTCHA_ID}></div>;

};
export type { AliyunAuthResponse, AliyunCaptchaRefType }
export default forwardRef<AliyunCaptchaRefType, AliyunCaptchaProps>(AliyunCaptcha);

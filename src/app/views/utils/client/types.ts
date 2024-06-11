interface RecaptchaPreparationResp {
    provider: "recaptcha";
    site_key: string;
};

interface AliyunCaptchaPreparationResp {
    provider: "aliyun";
    appKey: string;
    scene: string;
};

interface AliyunCaptchaNewPreparationResp {
    provider: "aliyun2";
    sceneId: string;
    prefix: string;
}

export type {
    AliyunCaptchaPreparationResp,
    RecaptchaPreparationResp,
    AliyunCaptchaNewPreparationResp
}

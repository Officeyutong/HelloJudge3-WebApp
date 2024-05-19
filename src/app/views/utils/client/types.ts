interface RecaptchaPreparationResp {
    provider: "recaptcha";
    site_key: string;
};

interface AliyunCaptchaPreparationResp {
    provider: "aliyun";
    appKey: string;
    scene: string;
};

export type {
    AliyunCaptchaPreparationResp,
    RecaptchaPreparationResp
}

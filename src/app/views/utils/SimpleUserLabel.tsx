import React from "react";

const SimpleUserLabel: React.FC<React.PropsWithChildren<{ uid: number; username: string }>> = ({ uid, username }) => {
    return <a href={`/profile/${uid}`} target="_blank" rel="noreferrer">{username}</a>
};

export default SimpleUserLabel;

import React, { useEffect, useRef, useState } from "react";
import { useRouteMatch } from "react-router-dom";
import { Button, Dimmer, Grid, Header, Icon, Loader, Modal, Rail, Ref, Segment, Sticky, Table } from "semantic-ui-react";
import { useCurrentUid, useDocumentTitle, useInputValue } from "../../common/Utils";
import { showConfirm } from "../../dialogs/Dialog";
import problemtodoClient from "../problemtodo/client/ProblemtodoClient";
import InviteCodeInputModal from "../utils/InviteCodeInputModal";
import JudgeStatusLabel from "../utils/JudgeStatusLabel";
import ProblemTagLabel from "../utils/ProblemTagLabel";
import problemClient from "./client/ProblemClient";
import { ProblemInfo } from "./client/types";
import CodeInput from "./CodeInput";
import FileDownloadArea from "./FileDownloadArea";
import ProblemDiscussionBlock from "./ProblemDiscussionBlock";
import ProblemStatementView from "./ProblemStatementView";

const ShowProblem: React.FC<{}> = () => {
    const match = useRouteMatch<{ problemID: string }>();
    const problemID = match.params.problemID;
    const contextRef = useRef(null);
    const [data, setData] = useState<ProblemInfo | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [showInputModal, setShowInputModal] = useState(false);

    const inviteCode = useInputValue();
    const baseUid = useCurrentUid();
    const [inTodoList, setInTodoList] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        if (!loaded) {
            (async () => {
                try {
                    const data = await problemClient.getProblemInfo(parseInt(problemID), false);
                    setData(data);

                    if (!data.hasPermission) {
                        setShowInputModal(true);
                        setLoaded(true);

                        return;
                    }
                    if (data.problem_type === "remote_judge") {
                        window.location.href = `/remote_judge/show_problem/${data.id}`;
                    }
                    data.languages.sort((x, y) => {
                        if (x.id < y.id) return -1;
                        if (x.id === y.id) return 0;
                        return 1;
                    });
                    setInTodoList(data.inTodoList);
                    setLoaded(true);
                } catch (e) { } finally { }
            })();
        }
    }, [loaded, problemID]);
    useDocumentTitle(`${data?.title || "?????????"} - ${data?.id}`);
    const checkInviteCode = async () => {
        try {
            await problemClient.unlockProblem(problemID, inviteCode.value);
            setShowInputModal(false);
            setLoaded(false);
        } catch (e) {
        }
    };
    const removeProblem = () => {
        showConfirm("??????????????????????????????? ??????????????????????????????????????????????????????????????????????????????????????????????????????", async () => {
            try {
                await problemClient.removeProblem(data!.id);
                window.location.href = "/";
            } catch (e) { } finally { }
        }, "??????");
    };
    const toggleTodoState = async (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const target = evt.currentTarget;
        try {
            target.classList.add("loading");
            const current = inTodoList;
            if (current) {
                await problemtodoClient.remove(data!.id);
            } else {
                await problemtodoClient.add(data!.id);
            }
            setInTodoList(!current);
        } catch (e) { }
        finally {
            target.classList.remove("loading");
        }
    };
    const handleSubmit = (code: string, language: string, params: number[]) => {
        const doNext = async () => {
            try {
                setSubmitting(true);
                const id = await problemClient.submit(data!.id, code, language, params, -1);
                window.open(`/show_submission/${id}`);
            } catch { } finally {
                setSubmitting(false);
            }
        };
        if (code.trim() === "") {
            showConfirm("???????????????????????????????", doNext);
        } else {
            doNext();
        }

    };
    const managable = baseUid === data?.uploader?.uid || data?.managable || false;

    return <>
        {!loaded && <Dimmer active>
            <Loader></Loader>
        </Dimmer>}
        {showInputModal ? <InviteCodeInputModal
            {...inviteCode}
            title="??????????????????????????????:"
            onClose={checkInviteCode}
        ></InviteCodeInputModal> : (data !== null && loaded && <div>
            <Header as="h1">
                {data.id}: {data.title}
            </Header>
            <Segment style={{ maxWidth: "80%" }}>
                <Ref innerRef={contextRef}>
                    <div>
                        <div>
                            <ProblemStatementView
                                data={data}
                            ></ProblemStatementView>
                            {data.problem_type !== "submit_answer" ? <CodeInput
                                defaultCode={data.last_code}
                                defaultLanguage={data.last_lang === "" ? data.languages[0].id : data.last_lang}
                                languages={data.languages}
                                usedParameters={data.lastUsedParameters}
                                parameters={data.extra_parameter}
                                handleSubmit={handleSubmit}
                            ></CodeInput> : <div>
                                <Grid centered columns="3">
                                    <Grid.Column>
                                        <Button as="a" target="_blank" rel="noreferrer" href={`/submit_answer/${data.id}`} icon color="green" labelPosition="left" >
                                            <Icon name="paper plane outline"></Icon>
                                            ????????????
                                        </Button>
                                    </Grid.Column>
                                </Grid>
                            </div>}
                        </div>
                        <Rail position="right">
                            <Sticky context={contextRef}>
                                <Segment stacked style={{ maxWidth: "300px" }}>
                                    <Table
                                        basic="very"
                                        collapsing
                                        celled
                                    >
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>???????????????</Table.Cell>
                                                <Table.Cell style={{ wordBreak: "break-all" }}><a href={`/profile/${data.uploader.uid}`} target="_blank" rel="noreferrer">{data.uploader.username}</a></Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>????????????</Table.Cell>
                                                <Table.Cell style={{ wordBreak: "break-all" }}>{data.create_time}</Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>????????????</Table.Cell>
                                                <Table.Cell>{data.public ? 'Yes' : 'No'}</Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>????????????</Table.Cell>
                                                <Table.Cell>{data.score}</Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>????????????</Table.Cell>
                                                <Table.Cell>
                                                    {data.my_submission === -1 ? <div>????????????</div> : <a target="_blank" rel="noreferrer" href={`/show_submission/${data.my_submission}`}>
                                                        <JudgeStatusLabel status={data.my_submission_status}></JudgeStatusLabel>
                                                    </a>}
                                                </Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>?????????/?????????/?????????</Table.Cell>
                                                <Table.Cell>{data.accepted_count}/{data.submission_count}/{Math.ceil(100 * data.accepted_count / data.submission_count)}%</Table.Cell>
                                            </Table.Row>
                                            {data.using_file_io && <Table.Row>
                                                <Table.Cell>??????/????????????</Table.Cell>
                                                <Table.Cell>{data.input_file_name}<br />{data.output_file_name}</Table.Cell>
                                            </Table.Row>}
                                            <Table.Row>
                                                <Table.Cell>????????????</Table.Cell>
                                                <Table.Cell>{data.spj_filename === "" ? "????????????" : "Special Judge"}</Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>????????????</Table.Cell>
                                                <Table.Cell>{data.tags.map((x, i) => <ProblemTagLabel key={i} data={x}></ProblemTagLabel>)}</Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>
                                    <span>{managable && <a target="_blank" rel="noreferrer" href={`/problem_edit/${data.id}`}>??????</a>}  </span>
                                    {// eslint-disable-next-line jsx-a11y/anchor-is-valid
                                        <span>{managable && <a style={{ cursor: "pointer" }} onClick={removeProblem}>??????</a>}  </span>}
                                    <span><a href={`/submissions/1?filter=uid%3D${baseUid}%2Cproblem%3D${data.id}`} target="_blank" rel="noreferrer">????????????</a>  </span>
                                    <span> <a href={`/submissions/1?filter=problem%3D${data.id}`} target="_blank" rel="noreferrer">????????????</a>  </span>
                                    <span>  <a href={`/submissions/1?filter=status%3Daccepted%2Cproblem%3D${data.id}`} target="_blank" rel="noreferrer">????????????</a> </span>
                                    <Button style={{ marginTop: "20px" }} size="tiny" onClick={toggleTodoState} color={inTodoList ? "red" : "green"}>
                                        {inTodoList ? "?????????????????????" : "??????????????????"}
                                    </Button>
                                    {data.downloads.length !== 0 && <FileDownloadArea data={data} urlMaker={s => `/api/download_file/${data.id}/${s}`}></FileDownloadArea>}
                                </Segment>
                                <Segment stacked style={{ maxWidth: "300px" }}>
                                    <ProblemDiscussionBlock
                                        id={data.id}
                                    ></ProblemDiscussionBlock>
                                </Segment>
                            </Sticky>
                        </Rail>
                    </div>
                </Ref>
            </Segment>
        </div>)}
        {submitting && <Modal open closeOnDimmerClick={false} closeOnEscape={false} basic size="tiny">
            <Modal.Content>
                <Loader>?????????...</Loader>
            </Modal.Content>
        </Modal>}
    </>;
};

export default ShowProblem;

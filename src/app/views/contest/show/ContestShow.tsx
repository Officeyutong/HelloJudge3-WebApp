import { DateTime } from "luxon";
import QueryString from "qs";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router";
import { Button, Container, Dimmer, Divider, Form, Grid, Header, Icon, Loader, Message, Progress, Segment, Table } from "semantic-ui-react";
import { ButtonClickEvent } from "../../../common/types";
import { secondsToString, useCurrentUid, useDocumentTitle, useInputValue } from "../../../common/Utils";
import InviteCodeInputModal from "../../utils/InviteCodeInputModal";
import UserLink from "../../utils/UserLink";
import contestClient from "../client/ContestClient";
import { ContestShowDetailResponse, RankCriterionMapping } from "../client/types";
import { Markdown } from "../../../common/Markdown";
import { Link } from "react-router-dom";
import { PUBLIC_URL } from "../../../App";
import { showConfirm } from "../../../dialogs/Dialog";
import ContestShowProblemList from "./ContestShowProblemList";
import ClarificationList from "./ClarificationList";
import CreateProblemsetModal from "./CreateProblemsetModal";
enum ContestLoadStage {
    INIT = 1,
    PARTIAL_LOADED = 2,
    LOADED = 3
};
function timestampToString(timestamp: number): string {
    return DateTime.fromSeconds(timestamp).toJSDate().toLocaleString();
}

const ContestShow: React.FC<{}> = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const history = useHistory();
    const virtualID = parseInt(QueryString.parse(location.search.substr(1)).virtual_contest as (string | undefined) || "-1");
    const numberID = parseInt(id);

    const [stage, setStage] = useState<ContestLoadStage>(ContestLoadStage.INIT);
    const [data, setData] = useState<ContestShowDetailResponse | null>(null);
    const [now, setNow] = useState<DateTime>(DateTime.now());
    const [loading, setLoading] = useState(false);
    const [showCreateProblemsetModal, setShowCreateProblemsetModal] = useState(false);

    const baseUid = useCurrentUid();
    const inviteCode = useInputValue();
    const totalSeconds = useMemo(() => Math.max((data?.end_time || 0) - (data?.start_time || 0), 1), [data]);
    const passedSeconds = useMemo(() => Math.floor(now.diff(DateTime.fromSeconds(data?.start_time || 0), "seconds").as("seconds")), [data?.start_time, now]);
    const progress = useMemo(() => Math.floor(passedSeconds / totalSeconds * 100), [passedSeconds, totalSeconds]);
    const status = useMemo(() => {
        if (passedSeconds < 0) return -1;
        if (passedSeconds > 0 && passedSeconds < totalSeconds) return 0;
        return 1;
    }, [passedSeconds, totalSeconds]);

    const shouldShowRanklist = (
        (data?.managable || false) ||
        (status === 1) ||
        (data?.ranklist_visible || false) ||
        (data?.owner_id === baseUid)
    );
    useDocumentTitle(`${data?.name || "?????????..."} - ??????`);
    const partialLoaded = stage === ContestLoadStage.PARTIAL_LOADED;
    const loaded = stage === ContestLoadStage.LOADED;
    const currentIsOwner = data?.owner_id === baseUid;
    const managable = currentIsOwner || (data?.managable || false);
    useEffect(() => {
        if (!loaded) return;
        const token = setInterval(() => {
            setNow(DateTime.now());
        }, 1000);
        return () => clearInterval(token);
    });
    useEffect(() => {
        if (stage === ContestLoadStage.INIT) {
            (async () => {
                try {
                    setLoading(true);
                    const resp = await contestClient.getContestDetail(numberID, virtualID);
                    if (!resp.hasPermission) {
                        setStage(ContestLoadStage.PARTIAL_LOADED)
                    } else {
                        setData(resp);
                        setStage(ContestLoadStage.LOADED);
                    }
                } catch {

                } finally {
                    setLoading(false);
                }
            })();
        }
    }, [numberID, stage, virtualID]);
    const checkInviteCode = async (evt: ButtonClickEvent) => {
        const target = evt.currentTarget;
        try {
            target.classList.add("loading");
            await contestClient.unlockContest(numberID, inviteCode.value);
            setStage(ContestLoadStage.INIT);
        } catch { } finally {
            target.classList.remove("loading");
        }
    };
    const removeContest = () => {
        showConfirm("?????????????????????????????????????????????????????????????????????", async () => {
            try {
                setLoading(true);
                await contestClient.removeContest(data!.id);
                history.push(`${PUBLIC_URL}/contests/1`);
            } catch { } finally {
                setLoading(false);
            }
        }, "?????????????????????????????????");
    };
    const closeContest = async () => {
        showConfirm("???????????????????????????????????????????????????????????????????????????Virtual Participate", async () => {
            try {
                setLoading(true);
                await contestClient.closeContest(data!.id);
                setStage(ContestLoadStage.INIT);
            } catch { } finally {
                setLoading(false);
            }
        }, "???????????????????????????????");
    };
    return <>
        {partialLoaded && <InviteCodeInputModal
            {...inviteCode}
            title="??????????????????????????????"
            onClose={checkInviteCode}
        ></InviteCodeInputModal>}
        {loading && <div style={{ height: "400px" }}>
            <Dimmer active>
                <Loader></Loader>
            </Dimmer>
        </div>}
        {loaded && data !== null && <>
            <Header as="h1">
                {data.name}
            </Header>
            <Header as="h3">
                ????????????
            </Header>
            <Segment stacked>
                {data.closed && !data.virtual && <Message info >
                    <Message.Header>??????????????????</Message.Header>
                    <Message.Content>
                        ??????????????????????????????????????????????????????????????????????????????????????????
                    </Message.Content>
                </Message>}
                {data.virtual && <Message info>
                    <Message.Header>????????????????????????</Message.Header>
                    <Message.Content>
                        ??????????????????????????????????????????
                    </Message.Content>
                </Message>}

                <Form widths="equal">
                    <Form.Group widths="equal">
                        <Form.Field>
                            <label>????????????</label>
                            <span>{timestampToString(data.start_time)}</span>
                        </Form.Field>
                        <Form.Field>
                            <label>????????????</label>
                            <span>{timestampToString(data.end_time)}</span>
                        </Form.Field>
                        <Form.Field>
                            <label>??????</label>
                            {status < 0 && <span>????????????</span>}
                            {status === 0 && <span style={{ backgroundColor: "rgb(252, 255, 245)", color: "#2c662d" }}>
                                ?????? {secondsToString(Math.max(totalSeconds - passedSeconds, 0))}
                            </span>}
                            {status > 0 && <span style={{ backgroundColor: "#fff6f6", color: "#9f3a38" }}>?????????</span>}
                        </Form.Field>
                    </Form.Group>
                </Form>
                <Progress success active progress percent={Math.min(100, progress)}></Progress>
                <Divider></Divider>
                <Table basic="very" celled>
                    <Table.Body>
                        <Table.Row>
                            <Table.Cell>???????????????</Table.Cell>
                            <Table.Cell><UserLink data={{ uid: data.owner_id, username: data.owner_username }}></UserLink></Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>??????/????????????</Table.Cell>
                            <Table.Cell>{RankCriterionMapping[data.rank_criterion]}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>?????????????????????????????????</Table.Cell>
                            <Table.Cell>{data.judge_result_visible ? "Yes" : "No"}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell>??????????????????????????????</Table.Cell>
                            <Table.Cell>{data.ranklist_visible ? "Yes" : "No"}</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
                <Divider></Divider>
                <Grid columns="2">
                    <Grid.Column>
                        {/*???????????????*/}
                        {shouldShowRanklist && <Button
                            as={Link}
                            to={`${PUBLIC_URL}/contest/ranklist/${data.id}?virtual_contest=${virtualID}`}
                            color="yellow"
                            size="tiny"
                            icon
                            labelPosition="left">
                            <Icon name="signal"></Icon> ?????????
                        </Button>}
                        {baseUid !== -1 && <Button
                            color="blue"
                            size="tiny"
                            icon
                            labelPosition="left"
                            as={Link}
                            to={`${PUBLIC_URL}/submissions/1?filter=contest%3D${data.id},uid%3D${baseUid}`}
                        >
                            <Icon name="hdd"></Icon>
                            ????????????
                        </Button>}
                        {data.closed && !data.virtual && <Button
                            color="green"
                            size="tiny"
                            icon
                            labelPosition="left"
                            as={Link}
                            to={`${PUBLIC_URL}/virtualcontest/create/${data.id}`}
                        >
                            <Icon name="terminal"></Icon>
                            ??????????????????
                        </Button>}
                    </Grid.Column>
                    <Grid.Column>
                        <Container textAlign='right'>
                            {/* ??????????????? */}
                            {managable && <Button
                                size="tiny"
                                color="green"
                                as={Link}
                                to={`${PUBLIC_URL}/contest/edit/${data.id}`}
                                icon
                                labelPosition="left"
                            >
                                <Icon name="edit"></Icon>
                                ??????
                            </Button>}
                            {(managable && !data.virtual) && <Button
                                color="blue"
                                size="tiny"
                                as={Link}
                                to={`${PUBLIC_URL}/submissions/1?filter=contest%3D${data.id}`}
                                icon
                                labelPosition="left"
                            >
                                <Icon name="hdd"></Icon>
                                ????????????
                            </Button>}
                            {managable && !data.virtual && <Button
                                color="red"
                                size="tiny"
                                icon
                                labelPosition="left"
                                onClick={removeContest}
                            >
                                <Icon name="trash alternate"></Icon>
                                ????????????
                            </Button>}
                            {managable && !data.closed && <Button
                                color="red"
                                size="tiny"
                                onClick={closeContest}
                                icon
                                labelPosition="left"
                            >
                                <Icon name="window close outline"></Icon>
                                ????????????
                            </Button>}
                            {managable && data.closed && <Button
                                color="green"
                                size="tiny"
                                onClick={() => setShowCreateProblemsetModal(true)}
                                icon
                                labelPosition="left"
                            >
                                <Icon name="book"></Icon>
                                ???????????????
                            </Button>}
                        </Container>
                    </Grid.Column>
                </Grid>
                {data.description !== "" && <>
                    <Divider></Divider>
                    <Markdown markdown={data.description}></Markdown>
                </>}
            </Segment>
            <ContestShowProblemList
                problems={data.problems}
                rankCriterion={data.rank_criterion}
                contestID={data.id}
                virtualID={virtualID}
                closed={data.closed}
                running={status === 0}
                status={status}
            ></ContestShowProblemList>
            <ClarificationList
                closed={data.closed}
                contestID={data.id}
                managable={managable}
                virtualID={virtualID}
                status={status}
            ></ClarificationList>
            {showCreateProblemsetModal && <CreateProblemsetModal
                contest={data.id}
                onClose={() => setShowCreateProblemsetModal(false)}
                open={showCreateProblemsetModal}
                title={data.name}
            ></CreateProblemsetModal>}
        </>}
    </>;
};

export default ContestShow;

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { Button, Dimmer, Grid, Header, Loader, Rail, Ref, Segment, Sticky, Tab, Table } from "semantic-ui-react";
import { PUBLIC_URL } from "../../../App";
import { Markdown } from "../../../common/Markdown";
import { ButtonClickEvent } from "../../../common/types";
import { useCurrentUid, useDocumentTitle, useInputValue } from "../../../common/Utils";
import { showSuccessPopup } from "../../../dialogs/Utils";
import { StateType } from "../../../states/Manager";
import InviteCodeInputModal from "../../utils/InviteCodeInputModal";
import UserLink from "../../utils/UserLink";
import teamClient from "../client/TeamClient";
import { TeamDetail } from "../client/types";
import GeneralTeamStuff from "./GeneralTeamStuff";
import TeamMembers from "./TeamMembers";
import { DateTime } from "luxon";
import { showConfirm, showErrorModal } from "../../../dialogs/Dialog";
import TeamManage from "./TeamManage";
import TeamFile from "./TeamFile";

const TeamShow: React.FC<{}> = () => {
    const { team } = useParams<{ team: string }>();
    const [data, setData] = useState<null | TeamDetail>(null);
    const [loaded, setLoaded] = useState(false);
    const [showInviteCodeInput, setShowInviteCodeInput] = useState(false);
    const inviteCode = useInputValue();
    const currUser = useCurrentUid();
    const needInviteCode = data === null ? true : !data.hasPermission;
    const admins = useMemo(() => data === null ? new Set() : new Set(data.admins), [data]);
    const inTeam = useMemo(() => (data?.members || []).find(x => x.uid === currUser), [currUser, data?.members])
    const contextRef = useRef(null);
    const hasPermission = data?.hasPermission || false;
    const isTeamAdmin = currUser === data?.owner_id || admins.has(currUser);
    const hasManagePermission = isTeamAdmin || (data?.canManage || false);
    const alreadyLogin = useSelector((s: StateType) => s.userState.login);
    const [working, setWorking] = useState(false);
    const sortedTeamContests = useMemo(() => {
        const result = [...(data?.team_contests || [])];
        result.sort((x, y) => y.start_time - x.start_time)
        return result;
    }, [data?.team_contests]);
    useEffect(() => {
        if (!loaded) {
            (async () => {
                try {
                    const resp = await teamClient.getTeamDetail(parseInt(team));
                    setData(resp);
                    setLoaded(true);
                } catch { } finally { }
            })();
        }
    }, [loaded, team]);
    useDocumentTitle(`${data?.name || "?????????"} - ??????`);
    const joinTeam = async (evt: ButtonClickEvent) => {
        const target = evt.currentTarget;
        try {
            target.classList.add("loading");
            await teamClient.joinTeam(currUser, data!.id, inviteCode.value);
            setShowInviteCodeInput(false);
            setLoaded(false);
        } catch {

        } finally {
            target.classList.remove("loading");
        }
    };
    const tryToJoin = (evt: ButtonClickEvent) => {
        if (needInviteCode) {
            setShowInviteCodeInput(true);
            return;
        } else joinTeam(evt);
    };
    const quitTeam = async (evt: ButtonClickEvent) => {
        const target = evt.currentTarget;
        try {
            target.classList.add("loading");
            await teamClient.quitTeam(currUser, data!.id);
            setLoaded(false);
        } catch { } finally {
            target.classList.remove("loading");
        }
    };
    const setAdmin = async (uid: number, value: boolean) => {
        if (data === null) return;
        try {
            setWorking(true);
            await teamClient.teamSetAdmin(data!.id, uid, value);
            setData({ ...data, admins: [...data.admins.filter(x => x !== uid), ...(value ? [uid] : [])] })
            showSuccessPopup("????????????");
        } catch { } finally {
            setWorking(false);
        }
    }
    const kickOut = async (uid: number) => {
        if (data === null) return;
        try {
            setWorking(true);
            await teamClient.quitTeam(uid, data.id);
            setData({ ...data, members: data.members.filter(x => x.uid !== uid) });
            showSuccessPopup("????????????");
        } catch { } finally {
            setWorking(false);
        }
    }
    const addStuff = (text: string, type: "problem" | "contest" | "problemset") => {
        const nameMap = {
            problem: "????????????",
            contest: "????????????",
            problemset: "???????????????"
        }
        const toAdd = text.trim().split(",").map(x => parseInt(x.trim()));
        if (toAdd.some(x => isNaN(x))) {
            showErrorModal("??????????????????????????????????????????????????????");
            return;
        }
        showConfirm(`?????????????????? ${toAdd.join(",")} ???${nameMap[type]}?????? ????????????????????????????????????????????????${nameMap[type]}???`, async () => {
            try {
                const things = {
                    problem: [],
                    contest: [],
                    problemset: []
                } as { [K in typeof type]: number[] };
                things[type] = toAdd;
                setWorking(true);
                await teamClient.addTeamThings(parseInt(team), things.problem, things.contest, things.problemset);
                setData(await teamClient.getTeamDetail(parseInt(team)));
            } catch { } finally {
                setWorking(false);
            }
        });
    };
    return <>
        {showInviteCodeInput && <InviteCodeInputModal
            {...inviteCode}
            title="??????????????????????????????"
            onClose={joinTeam}
            closeWithoutConfirm={() => setShowInviteCodeInput(false)}
            allowClose
        ></InviteCodeInputModal>}
        {!loaded && <Segment>
            <div style={{ height: "400px" }}></div>
            <Dimmer active>
                <Loader></Loader>
            </Dimmer>
        </Segment>}
        {loaded && data !== null && <>
            <Grid columns="2">
                <Grid.Column width="12">
                    <Header as="h1">
                        {data.name}
                    </Header>
                    <Ref innerRef={contextRef}>
                        <div>
                            <div>
                                <Segment stacked>
                                    {working && <Dimmer active>
                                        <Loader></Loader>
                                    </Dimmer>}
                                    {hasPermission ? <>
                                        <Tab menu={{ pointing: true }} panes={[
                                            {
                                                menuItem: "??????",
                                                render: () => data.description.trim() === "" ? <div>????????????????????????...</div> : <Markdown markdown={data.description}></Markdown>
                                            },
                                            {
                                                menuItem: "????????????",
                                                render: () => <TeamMembers
                                                    admins={data.admins}
                                                    members={data.members}
                                                    owner_id={data.owner_id}
                                                    setAdmin={setAdmin}
                                                    kick={kickOut}
                                                    hasManagePermission={hasManagePermission}
                                                    isTeamOwner={currUser === data.owner_id}
                                                ></TeamMembers>
                                            },
                                            {
                                                menuItem: "????????????",
                                                render: () => <GeneralTeamStuff
                                                    promptButtonString="??????????????????"
                                                    addCallback={text => addStuff(text, "problem")}
                                                    isTeamAdmin={isTeamAdmin}
                                                    data={data.team_problems}
                                                    lineMapper={(line) => [<Link to={`${PUBLIC_URL}/show_problem/${line.id}`}>#{line.id}. {(line as TeamDetail["team_problems"][0]).title}</Link>]}
                                                ></GeneralTeamStuff>
                                            },
                                            {
                                                menuItem: "????????????",
                                                render: () => <GeneralTeamStuff
                                                    promptButtonString="??????????????????"
                                                    addCallback={text => addStuff(text, "contest")}
                                                    isTeamAdmin={isTeamAdmin}
                                                    data={sortedTeamContests}
                                                    title={["ID", "??????", "????????????"]}
                                                    lineMapper={(line) => {
                                                        const currLine = line as TeamDetail["team_contests"][0];

                                                        return [<Link to={`${PUBLIC_URL}/contest/${currLine.id}`}>{currLine.id}</Link>, <Link to={`${PUBLIC_URL}/contest/${currLine.id}`}>{currLine.name}</Link>, <span>{DateTime.fromSeconds(currLine.start_time).toJSDate().toLocaleString()}</span>]
                                                    }}
                                                ></GeneralTeamStuff>
                                            },
                                            {
                                                menuItem: "???????????????",
                                                render: () => <GeneralTeamStuff
                                                    promptButtonString="?????????????????????"
                                                    addCallback={text => addStuff(text, "problemset")}
                                                    isTeamAdmin={isTeamAdmin}
                                                    data={data.team_problemsets}
                                                    title={["ID", "??????"]}
                                                    lineMapper={(line) => {
                                                        const currLine = line as TeamDetail["team_problemsets"][0];
                                                        return [<Link to={`${PUBLIC_URL}/problemset/show/${currLine.id}`}>#{currLine.id}</Link>, <Link to={`${PUBLIC_URL}/problemset/show/${currLine.id}`}> {currLine.name}</Link>]
                                                    }}
                                                ></GeneralTeamStuff>
                                            },
                                            {
                                                menuItem: "????????????",
                                                render: () => <TeamFile
                                                    isAdmin={isTeamAdmin}
                                                    teamID={data.id}
                                                ></TeamFile>
                                            },
                                            (data.canManage ? {
                                                menuItem: "??????",
                                                render: () => <TeamManage
                                                    team={data.id}
                                                    reloadCallback={() => setLoaded(false)}
                                                    teamMembers={data.members}
                                                ></TeamManage>
                                            } : {})
                                        ]}></Tab>
                                    </> : <>
                                        <span style={{ fontSize: "large" }}>??????????????????????????????????????????????????????</span>
                                    </>}
                                </Segment>
                            </div>
                            <Rail position="right">
                                <Sticky context={contextRef}>
                                    <Segment>
                                        <Table basic="very" celled>
                                            <Table.Body>
                                                <Table.Row>
                                                    <Table.Cell>???????????????</Table.Cell>
                                                    <Table.Cell><UserLink data={{ uid: data.owner_id, username: data.owner_username }}></UserLink></Table.Cell>
                                                </Table.Row>
                                                <Table.Row>
                                                    <Table.Cell>????????????</Table.Cell>
                                                    <Table.Cell>{data.private ? "??????" : "??????"}</Table.Cell>
                                                </Table.Row>
                                                {hasPermission && <Table.Row>
                                                    <Table.Cell>????????????</Table.Cell>
                                                    <Table.Cell>{data.create_time}</Table.Cell>
                                                </Table.Row>}

                                            </Table.Body>
                                        </Table>
                                        <Grid columns="2">
                                            <Grid.Column>
                                                {currUser !== data.owner_id && alreadyLogin && <>
                                                    {inTeam ? <Button color="red" onClick={quitTeam}>????????????</Button> : <Button color="green" onClick={tryToJoin}>????????????</Button>}
                                                </>}
                                            </Grid.Column>
                                            <Grid.Column>
                                                {isTeamAdmin && <Button as={Link} to={`${PUBLIC_URL}/edit_team/${data.id}`} color="green">
                                                    ??????
                                                </Button>}
                                            </Grid.Column>
                                        </Grid>
                                    </Segment>
                                </Sticky>
                            </Rail>
                        </div>
                    </Ref>
                </Grid.Column>
            </Grid>
        </>}
    </>;
};

export default TeamShow;
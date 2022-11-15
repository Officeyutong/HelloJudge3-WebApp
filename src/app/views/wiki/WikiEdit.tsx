import { DateTime } from "luxon";
import QueryString from "qs";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Button, Container, Dimmer, Form, Grid, Header, Loader, Segment } from "semantic-ui-react";
import { converter } from "../../common/Markdown";
import { toLocalTime, useDocumentTitle } from "../../common/Utils";
import { useAceTheme } from "../../states/StateUtils";
import UserLink from "../utils/UserLink";
import { WikiPageDetail } from "./client/types";
import wikiClient from "./client/WikiClient";
import AceEditor from "react-ace";
import { ButtonClickEvent } from "../../common/types";
import { showSuccessModal } from "../../dialogs/Dialog";
import { PUBLIC_URL } from "../../App";
const WikiEdit: React.FC<React.PropsWithChildren<{}>> = () => {
    const { page: toEditPage } = useParams<{ page?: string }>();
    const { baseversion } = QueryString.parse(useLocation().search.substring(1)) as { baseversion?: string };
    const realBaseVersion = baseversion === undefined ? -1 : parseInt(baseversion);
    const isCreating = toEditPage === undefined;
    const isEditing = !isCreating;
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [comment, setComment] = useState("");
    const [useNavigationMenu, setUseNavigationMenu] = useState(false);
    const [navigationID, setNavigationID] = useState(-1);
    const [editingData, setEditingData] = useState<null | WikiPageDetail>(null);
    const lastRender = useRef<number>(DateTime.now().toSeconds());

    const [htmlContent, setHtmlContent] = useState("");

    const theme = useAceTheme();

    const titleString = isCreating ? "创建Wiki条目" : `修改页面 ${editingData?.title || "加载中.."}`;
    useDocumentTitle(titleString);
    useEffect(() => {
        if (DateTime.now().toSeconds() - lastRender.current >= 3) {
            setHtmlContent(converter.makeHtml(content));
            lastRender.current = DateTime.now().toSeconds();
        }
    }, [content]);
    useEffect(() => {
        if (!loaded) {
            if (!isCreating) {
                (async () => {
                    try {
                        setLoading(true);
                        const resp = await wikiClient.getWikiPageDetails(parseInt(toEditPage as string), realBaseVersion, true);
                        setEditingData(resp);
                        setTitle(resp.title);
                        setContent(resp.content);
                        setUseNavigationMenu(resp.navigationID !== null)
                        setNavigationID(resp.navigationID === null ? -1 : resp.navigationID);
                        setLoaded(true);
                        setLoading(false);
                    } catch { } finally { }
                })();
            } else {
                setLoaded(true);
            }
        }
    }, [isCreating, loaded, realBaseVersion, toEditPage]);
    const submit = async (evt: ButtonClickEvent) => {
        const target = evt.currentTarget;
        target.classList.add("loading");
        try {
            if (isEditing) {
                await wikiClient.createNewVersion(parseInt(toEditPage as string), editingData!.version, content, useNavigationMenu ? navigationID : null, comment);
                showSuccessModal("操作完成!");
            } else {
                const { pageID } = await wikiClient.createNewPage(title, content, useNavigationMenu ? navigationID : null);
                showSuccessModal("操作完成!");
                window.open(`${PUBLIC_URL}/wiki/page/${pageID}`);
            }
        } catch { } finally {
            target.classList.remove("loading");
        }

    };
    return <>
        <Header as="h1">
            {titleString}
        </Header>
        <Segment>
            {loading && !loaded && <div style={{ height: "400px" }}>
                <Dimmer active>
                    <Loader active></Loader></Dimmer>
            </div>}
            {loaded && <>
                {loading && <Dimmer active>
                    <Loader></Loader>
                </Dimmer>}
                <Grid columns="2">
                    <Grid.Column width="8">
                        <Segment
                            style={{ overflowY: "scroll", wordWrap: "break-word", maxHeight: "800px" }}
                        >
                            <div dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
                        </Segment>
                    </Grid.Column>
                    <Grid.Column width="8">
                        <Form>
                            <Form.Input disabled={isEditing} label="标题" value={title} onChange={(_, d) => setTitle(d.value)}></Form.Input>
                            <Form.Checkbox checked={useNavigationMenu} toggle onChange={(_, d) => setUseNavigationMenu(d.checked as boolean)} label="使用导航菜单"></Form.Checkbox>
                            {useNavigationMenu && <Form.Input label="导航菜单ID" value={navigationID} onChange={(_, d) => setNavigationID(parseInt(d.value))} type="number"></Form.Input>}
                            {isEditing && <>
                                {editingData !== null && <Form.Field>
                                    <label>版本</label>
                                    <div>基于用户 <UserLink data={editingData.user}></UserLink> 于 {toLocalTime(editingData.time)} 发布的版本 {editingData.version}</div>
                                </Form.Field>}
                                <Form.Input label="版本注释" value={comment} onChange={(_, d) => setComment(d.value)}></Form.Input>
                            </>}
                            <Form.Field>
                                <label>Wiki内容</label>
                                <AceEditor
                                    wrapEnabled
                                    width="100%"
                                    height="600px"
                                    value={content}
                                    onChange={setContent}
                                    theme={theme}
                                ></AceEditor>
                            </Form.Field>
                        </Form>
                        <Container textAlign="right">
                            <Button color="green" onClick={submit}>提交</Button>
                        </Container>
                    </Grid.Column>
                </Grid>
            </>}
        </Segment>
    </>;
}

export default WikiEdit;
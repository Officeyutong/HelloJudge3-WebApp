import QueryString from "qs";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Button, Container, Dimmer, Divider, Header, Loader, Menu, Rail, Ref, Segment, Sticky } from "semantic-ui-react";
import { PUBLIC_URL } from "../../../App";
import { Markdown } from "../../../common/Markdown";
import { useDocumentTitle } from "../../../common/Utils";
import { GetWikiConfigResponse, WikiPageDetail } from "../client/types";
import wikiClient from "../client/WikiClient";
import SideMenu from "./SideMenu";
type LocalConfigType = GetWikiConfigResponse<false>;
const WikiPage: React.FC = () => {
    const { page } = useParams<{ page?: string }>();
    const realPage = page === undefined ? -1 : parseInt(page);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<null | LocalConfigType>(null);
    const [data, setData] = useState<WikiPageDetail | null>(null);
    const { version } = QueryString.parse(useLocation().search.substring(1)) as { version: string };
    const numberVersion = version === undefined ? -1 : parseInt(version);
    const contextRef = useRef(null);
    useDocumentTitle(`${data?.title || "加载中.."} - 百科`);
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [page, config] = await Promise.all([
                    wikiClient.getWikiPageDetails(realPage, numberVersion, false),
                    wikiClient.getWikiConfig<false>(false)
                ]);
                setData(page);
                setConfig(config);
                setLoading(false);
                setLoaded(true);
            } catch { } finally { }
        })();
    }, [loaded, numberVersion, realPage]);
    return <>
        {!loaded && loading && <div style={{ height: "400px" }}       >
            <Dimmer active>
                <Loader active></Loader>
            </Dimmer>
        </div>}
        {loaded && config !== null && data !== null && <>
            <Menu fixed="top" style={{ width: "auto", left: "auto" }}>
                <Container textAlign="center">
                    {config.navigations.map((item, i) => <Menu.Item key={i} as="a" href={item.menu[0].target !== -1 ? `${PUBLIC_URL}/wiki/${item.menu[0].target}` : undefined}>{item.title}</Menu.Item>)}
                </Container>
            </Menu>
            <Header as="h1">
                {data.title}
            </Header>

            <Ref innerRef={contextRef}>
                <Segment stacked style={{ minWidth: "500px", maxWidth: "70%" }}>
                    <Rail position="right">
                        {data.menu.length !== 0 && <Sticky context={contextRef}>
                            <div>
                                <SideMenu menu={data.menu}></SideMenu>
                            </div>
                        </Sticky>}
                    </Rail>
                    <Markdown markdown={data.content}></Markdown>
                    {(data.comment !== null && data.comment.trim() !== "") && <>
                        <Divider></Divider>
                        <Header as="h4">
                            版本注释
                        </Header>
                        <Container>
                            {data.comment}
                        </Container>
                    </>}
                    <Divider></Divider>
                    <Container textAlign="left">
                        <Button size="tiny" color="green" as={Link} to={`${PUBLIC_URL}/wiki/versions/${data.pageID}`}>
                            查看所有版本
                        </Button>
                    </Container>
                </Segment>
            </Ref>
        </>}
    </>;
}

export default WikiPage;
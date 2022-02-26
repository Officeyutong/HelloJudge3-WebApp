import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Container, Dimmer, Header, Loader, Pagination, Segment, Table } from "semantic-ui-react";
import { PUBLIC_URL } from "../../App";
import { ButtonClickEvent } from "../../common/types";
import { toLocalTime, useDocumentTitle } from "../../common/Utils";
import UserLink from "../utils/UserLink";
import { WikiVersionListItem } from "./client/types";
import wikiClient from "./client/WikiClient";

const WikiVersionList: React.FC<{}> = () => {
    const { page: pageID } = useParams<{ page: string }>();
    const numberPage = parseInt(pageID);
    const [data, setData] = useState<WikiVersionListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageCount, setPageCount] = useState(-1);
    const [loaded, setLoaded] = useState(false);
    useDocumentTitle(`页面 ${numberPage} 的历史版本`);
    const loadPage = useCallback(async (page: number) => {
        try {
            setLoading(true);
            const resp = await wikiClient.getVersionList(numberPage, page);
            setPageCount(resp.pageCount);
            setData(resp.data);
            setPage(page);
            setLoaded(true);
        } catch { } finally {
            setLoading(false);
        }
    }, [numberPage]);
    const verify = async (evt: ButtonClickEvent, version: number) => {
        const target = evt.currentTarget;
        try {
            target.classList.add("loading");
            await wikiClient.verifyVersion(version);
            await loadPage(page);
        } catch { } finally {
            target.classList.remove("loading");
        }
    }
    useEffect(() => {
        if (!loaded) {
            loadPage(1);
        }
    }, [loadPage, loaded]);

    return <>
        <Header as="h1">
            页面 {numberPage} 的历史版本列表
        </Header>

        <Segment>
            {loading && <div style={{ height: "400px" }}>
                <Dimmer active>
                    <Loader active></Loader>
                </Dimmer></div>}
            {data.length !== 0 ? <>
                <Table textAlign="center">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>版本ID</Table.HeaderCell>
                            <Table.HeaderCell>标题</Table.HeaderCell>
                            <Table.HeaderCell>发布时间</Table.HeaderCell>
                            <Table.HeaderCell>发布者</Table.HeaderCell>
                            <Table.HeaderCell>审核状态</Table.HeaderCell>
                            <Table.HeaderCell>前序版本</Table.HeaderCell>
                            <Table.HeaderCell>导航菜单ID</Table.HeaderCell>
                            <Table.HeaderCell>注释</Table.HeaderCell>
                            <Table.HeaderCell>操作</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {data.map((row, i) => <Table.Row key={i}>
                            <Table.Cell>{row.id}</Table.Cell>
                            <Table.Cell><a href={`${PUBLIC_URL}/wiki/page/${numberPage}?version=${row.id}`} target="_blank" rel="noreferrer">{row.title}</a></Table.Cell>
                            <Table.Cell>{toLocalTime(row.time)}</Table.Cell>
                            <Table.Cell><UserLink data={row.user}></UserLink></Table.Cell>
                            <Table.Cell positive={row.verified} negative={!row.verified}>
                                {row.verified ? "已审核" : "未审核"}
                            </Table.Cell>
                            <Table.Cell>{row.base}</Table.Cell>
                            <Table.Cell>{row.nagivationID}</Table.Cell>
                            <Table.Cell>{row.comment}</Table.Cell>
                            <Table.Cell>
                                <Button.Group>
                                    <Button size="tiny" color="green" as={Link} to={`${PUBLIC_URL}/wiki/edit/${numberPage}?baseversion=${row.id}`}>
                                        编辑
                                    </Button>
                                    <Button size="tiny" color="blue" onClick={e => verify(e, row.id)} >
                                        审核
                                    </Button>
                                </Button.Group>
                            </Table.Cell>
                        </Table.Row>)}
                    </Table.Body>
                </Table>
                <Container textAlign="center">
                    <Pagination
                        totalPages={pageCount}
                        activePage={page}
                        onPageChange={(_, d) => loadPage(d.activePage as number)}
                    >
                    </Pagination></Container>
            </> : <Container textAlign="center">无数据！</Container>}
        </Segment>
    </>;
}

export default WikiVersionList;
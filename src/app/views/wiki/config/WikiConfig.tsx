import { useEffect, useState } from "react";
import { Button, Dimmer, Divider, Form, Header, Icon, Loader, Segment } from "semantic-ui-react";
import wikiClient from "../client/WikiClient";
import { GetWikiConfigResponse, NavigationEntry, WikiConfig as TWikiConfig } from "../client/types";
import { PUBLIC_URL } from "../../../App";
import { useDocumentTitle } from "../../../common/Utils";
import NavEntryEdit from "./NavEntryEdit";
import { Schema, validate } from "jsonschema";
import { showErrorModal, showSuccessModal } from "../../../dialogs/Dialog";
type NavList = NavigationEntry<true>[];

const SCHEMA: Schema = {
    type: "array",
    items: {
        type: "object",
        properties: {
            target: { type: "number" },
            title: { type: "string" },
            children: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        target: { type: "number" },
                        title: { type: "string" }
                    },
                    required: ["target", "title"]
                }
            }
        },
        required: ["target", "title", "children"]
    }
};

const WikiConfig: React.FC<React.PropsWithChildren<{}>> = () => {
    useDocumentTitle("编辑Wiki设置");
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [config, setConfig] = useState<null | TWikiConfig>(null);
    const [navList, setNavList] = useState<NavList>([]);
    useEffect(() => {
        if (!loaded) {
            (async () => {
                try {
                    setLoading(true);
                    const resp = await wikiClient.getWikiConfig(true) as GetWikiConfigResponse<true>;
                    setConfig(resp.config);
                    setNavList(resp.navigations);
                    setLoading(false);
                    setLoaded(true);
                } catch { } finally { }
            })();
        }
    }, [loaded]);
    const addNav = async () => {
        try {
            setLoading(true);
            const resp = await wikiClient.createNavigationItem();
            setNavList(c => [...c, resp]);
        } catch { } finally { setLoading(false); }
    };
    const removeNav = async (id: number) => {
        try {
            setLoading(true);
            await wikiClient.removeNavigationItem(id);
            setNavList(c => c.filter(t => t.id !== id));
        } catch { } finally { setLoading(false); }
    }
    const save = async () => {
        try {
            setLoading(true);
            for (let item of navList) {
                let jsonobj;
                try {
                    jsonobj = JSON.parse(item.menu);
                } catch (e) {
                    showErrorModal(`导航菜单 ${item.id}: ${item.title} 的菜单项不是合法的JSON:\n${e}`);
                    return;
                }
                const curr = validate(jsonobj, SCHEMA);
                if (!curr.valid) {
                    showErrorModal(`导航菜单 ${item.id}: ${item.title} 的菜单项有错误:\n${curr.toString()}`);
                    return;
                }
            }
            await wikiClient.updateWikiConfig(config!, navList);
            showSuccessModal("更新完成!");
        } catch { } finally {
            setLoading(false);
        }

    }
    return <>
        <Header as="h1">
            编辑 Wiki 配置
        </Header>
        <Segment stacked>
            {loading && !loaded && <>
                <div style={{ height: "400px" }}>
                    <Dimmer active>
                        <Loader></Loader>
                    </Dimmer>
                </div>
            </>}
            {loaded && config !== null && <>
                {loading && <Dimmer active><Loader></Loader></Dimmer>}
                <Button as="a" target="_blank" rel="noreferrer" href={`${PUBLIC_URL}/wiki/edit`} color="green" labelPosition="right" icon>
                    创建新页面
                    <Icon name="paper plane outline"></Icon>
                </Button>
                <Divider></Divider>
                <Header as="h2">
                    配置
                </Header>
                <Form>
                    <Form.Input label="主页文章ID" value={config.indexPage} onChange={(_, d) => setConfig({ ...config, indexPage: d.value })}></Form.Input>
                </Form>
                <Divider></Divider>
                <Header as="h2">导航栏</Header>
                {navList.map((item, i) => <NavEntryEdit key={i}
                    data={item}
                    onRemove={() => removeNav(item.id)}
                    onUpdate={u => setNavList(p => p.map(q => q.id === item.id ? u : q))}
                ></NavEntryEdit>)}
            </>}
            <Button color="blue" onClick={addNav}>添加导航项</Button>
            <Button color="green" onClick={save}>保存更改</Button>

        </Segment>
    </>;
};

export default WikiConfig;
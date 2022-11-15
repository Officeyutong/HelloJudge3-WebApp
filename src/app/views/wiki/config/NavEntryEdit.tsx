import { Divider, Form, Header } from "semantic-ui-react";
import { NavigationEntry } from "../client/types";
import AceEditor from "react-ace";
import { useAceTheme } from "../../../states/StateUtils";
interface NavEntryProps {
    data: NavigationEntry<true>,
    onUpdate: (d: NavigationEntry<true>) => void,
    onRemove: () => void
}

const NavEntryEdit: React.FC<React.PropsWithChildren<NavEntryProps>> = ({ data, onRemove, onUpdate }) => {
    const theme = useAceTheme();
    return <div>
        <Header as="h2">{data.title}</Header>
        <Form>
            <Form.Field>
                <label>导航项ID</label>
                <div>{data.id}</div>
            </Form.Field>
            <Form.Input value={data.priority} onChange={(_, d) => onUpdate({ ...data, priority: parseInt(d.value) })} type="text" label="优先级"></Form.Input>
            <Form.Input label="标题" value={data.title} onChange={(_, d) => onUpdate({ ...data, title: d.value })}></Form.Input>
            <Form.Field>
                <label>菜单项编辑</label>
                <AceEditor
                    value={data.menu}
                    onChange={d => onUpdate({ ...data, menu: d })}
                    width="100%"
                    height="300px"
                    theme={theme}
                    mode="plain_text"
                ></AceEditor>
            </Form.Field>
            <Form.Button size="tiny" color="red" onClick={onRemove}>删除</Form.Button>
        </Form>

        <Divider></Divider>
    </div>;
};

export default NavEntryEdit;
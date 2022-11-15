import { useEffect, useState } from "react";
import { Header, Icon, Menu } from "semantic-ui-react";
import { PUBLIC_URL } from "../../../App";
import { WikiNavigationListItem } from "../client/types";

interface SideMenuProps {
    menu: WikiNavigationListItem[];
}

const SideMenu: React.FC<React.PropsWithChildren<SideMenuProps>> = ({ menu }) => {
    const [expanding, setExpanding] = useState<number[]>([]);
    useEffect(() => {
        setExpanding([]);
    }, [menu]);
    const toggle = (i: number) => {
        setExpanding(c => c.includes(i) ? c.filter(j => j !== i) : [...c, i]);
    }
    const testExpanding = (i: number) => expanding.includes(i);
    const makeUrl = (v: number) => v === -1 ? undefined : `${PUBLIC_URL}/wiki/page/${v}`;
    return <>
        <Menu vertical>
            {menu.map((item, i) => <Menu.Item key={i}>
                <Header as="h5">
                    <div><Icon
                        style={{ cursor: "pointer" }} onClick={() => toggle(i)}

                        name={testExpanding(i) ? "angle down" : "angle right"}
                    ></Icon>
                        <a href={makeUrl(item.target)} target="_blank" rel="noreferrer">{item.title}</a></div>
                </Header>
                {testExpanding(i) && <div>
                    {item.children.map((chd, i) => <Menu.Item as="a" href={makeUrl(chd.target)} target="_blank" rel="noreferrer"  key={i}>
                        {chd.title}
                    </Menu.Item>)}
                </div>}
            </Menu.Item>)}
        </Menu>
    </>;
}


export default SideMenu;
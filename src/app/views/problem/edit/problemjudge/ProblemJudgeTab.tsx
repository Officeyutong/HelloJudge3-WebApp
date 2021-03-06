import React, { useCallback, useState } from "react";
import { Button, Checkbox, Dimmer, Form, Header, Input, Loader, Message, Segment } from "semantic-ui-react";
import { showConfirm, showSuccessModal } from "../../../../dialogs/Dialog";
import { showSuccessPopup } from "../../../../dialogs/Utils";
import problemClient from "../../client/ProblemClient";
import { ProblemEditReceiveInfo } from "../../client/types";
import ExtraParameterConfig from "./ExtraParameterEdit";
import SubtaskEdit from "./subtask/SubtasksEdit";

type DataEntryProps = Pick<ProblemEditReceiveInfo,
    "extra_parameter" |
    "input_file_name" |
    "output_file_name" |
    "spj_filename" |
    "subtasks" |
    "using_file_io" |
    "files" |
    "problem_type"
> & {
    submitAnswer: boolean;
};

interface ProblemDataProps extends DataEntryProps {
    id: number;
    onUpdateSubmitAnswer: (v: boolean) => void;
    onUpdate: (data: DataEntryProps) => void;
};



const ProblemJudgeTab: React.FC<ProblemDataProps> = (data) => {
    const update = useCallback((localData: Partial<DataEntryProps>) => {
        const { extra_parameter, files, input_file_name, output_file_name, problem_type, spj_filename, submitAnswer, subtasks, using_file_io } = {
            extra_parameter: data.extra_parameter,
            files: data.files,
            input_file_name: data.input_file_name,
            output_file_name: data.output_file_name,
            problem_type: data.problem_type,
            spj_filename: data.spj_filename,
            submitAnswer: data.submitAnswer,
            subtasks: data.subtasks,
            using_file_io: data.using_file_io,
            ...localData
        };
        data.onUpdate({
            extra_parameter, files, input_file_name, output_file_name, problem_type, spj_filename, submitAnswer, subtasks, using_file_io
        });
    }, [data]);
    const [loading, setLoading] = useState(false);
    const refreshCache = async () => {
        try {
            setLoading(true);
            await problemClient.refreshCachedCount(data.id);
            showSuccessPopup("????????????");
        } catch { } finally {
            setLoading(false);
        }
    };
    const rejudgeAll = () => {
        showConfirm("????????????????????????????????????????????????????????????????", async () => {
            try {
                setLoading(true);
                await problemClient.rejudgeAll(data.id);
                showSuccessModal("?????????????????????????????????????????????.");
            } catch { } finally {
                setLoading(false);
            }
        });
    };
    const updateExtraParameter = useCallback(d => update({ extra_parameter: d }), [update]);
    const updateSubtasks = useCallback(d => update({ subtasks: d }), [update]);
    return <div>
        {loading && <Dimmer active>
            <Loader></Loader>
        </Dimmer>}
        <Header as="h3">
            ??????
        </Header>
        <div>
            <Button color="blue" onClick={refreshCache}>???????????????????????????AC???</Button>
            <Button color="blue" onClick={rejudgeAll}>????????????????????????</Button>
        </div>
        <Header as="h3">
            ??????????????????
        </Header>
        <Segment>
            <Form>
                <Form.Field>
                    <label>SPJ?????????</label>
                    <Input placeholder="??????????????????SPJ" value={data.spj_filename} onChange={(_, d) => update({ ...data, spj_filename: d.value })}></Input>
                </Form.Field>
                <Form.Group widths="equal">
                    <Form.Field disabled={!data.using_file_io}>
                        <label>???????????????</label>
                        <Input value={data.input_file_name} onChange={(_, d) => update({ ...data, input_file_name: d.value })}></Input>
                    </Form.Field>
                    <Form.Field disabled={!data.using_file_io}>
                        <label>???????????????</label>
                        <Input value={data.output_file_name} onChange={(_, d) => update({ ...data, output_file_name: d.value })}></Input>
                    </Form.Field>
                </Form.Group>
                <Form.Field>
                    <Checkbox label="????????????IO" toggle checked={data.using_file_io} onChange={() => update({ ...data, using_file_io: !data.using_file_io })}></Checkbox>
                </Form.Field>
                <Form.Field>
                    <label>????????????</label>
                    <Button.Group>
                        <Button onClick={() => data.onUpdateSubmitAnswer(false)} active={!data.submitAnswer} disabled={data.problem_type === "remote_judge"}>?????????</Button>
                        <Button onClick={() => data.onUpdateSubmitAnswer(true)} active={data.submitAnswer} disabled={data.problem_type === "remote_judge"}>???????????????</Button>
                        <Button active={data.problem_type === "remote_judge"} disabled>??????????????????</Button>
                    </Button.Group>
                </Form.Field>
                <Message info>
                    <Message.Header>
                        ??????SPJ
                    </Message.Header>
                    <Message.Content>
                        <p>SPJ?????????testlib???<a href="https://github.com/Officeyutong/HelloJudge2-Judger/blob/master/docker/testlib.h">????????????</a>????????????????????????testlib.h</p>
                    </Message.Content>
                </Message>
                {data.submitAnswer && <Message info>
                    <Message.Header>
                        ?????????????????????
                    </Message.Header>
                    <Message.Content>
                        <p>????????????????????????????????????????????????????????????zip????????????????????????????????????????????????</p>
                        <p>????????????????????????????????????????????????????????????</p>
                        <p>SPJ???????????????????????????????????????????????????????????????user_out?????????????????????????????????????????????</p>
                    </Message.Content>
                </Message>}
            </Form>
        </Segment>
        <ExtraParameterConfig
            data={data.extra_parameter}
            onUpdate={updateExtraParameter}
        ></ExtraParameterConfig>
        <SubtaskEdit
            subtasks={data.subtasks}
            files={data.files}
            onUpdate={updateSubtasks}
        ></SubtaskEdit>
    </div>;
};

export default ProblemJudgeTab;

export type {
    DataEntryProps,
    ProblemDataProps
};
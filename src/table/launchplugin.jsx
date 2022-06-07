import { TapirAPI } from "../login.js";
import { PLUGINS_CONFIG } from "../utils/plugins.jsx"; 
import { notifyError } from "../utils/notification";

import React from "react";
import { Modal, Form, Input, Checkbox, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

class NumericInput extends React.Component 
{
  onChange = e => {
    const { value } = e.target;
    const reg = /^-?\d*(\.\d*)?$/;
    if ((!isNaN(value) && reg.test(value)) || value === '' || value === '-') {
      this.props.onChange(value);
    }
  };

  // '.' at the end or only '-' in the input box.
  onBlur = () => {
    const { value, onBlur, onChange } = this.props;
    let valueTemp = value;
    if (value.charAt(value.length - 1) === '.' || value === '-') {
      valueTemp = value.slice(0, -1);
    }
    onChange(valueTemp.replace(/0*(\d+)/, '$1'));
    if (onBlur) {
      onBlur();
    }
  };

  render() 
  {
    return (
        <Input
          {...this.props}
          onChange={this.onChange}
          onBlur={this.onBlur}
          maxLength={25}
        />
    );
  }
}

function FormItemInteger(props)
{
  let name = props.name;

  return (
    <Form.Item
      label={name}
      name={name}
      key={name}
      rules={[{required: props.required, message: {name},},]}
    >
      <NumericInput placeholder={"Input " + name} /> 
    </Form.Item>)
}

function FormItemString(props)
{
  let name = props.name;

  return (
    <Form.Item
      label={name}
      name={name}
      key={name}
      rules={[{required: props.required, message: {name},},]}
    >
      <Input placeholder={"Input " + name} /> 
    </Form.Item>)
}

function FormItemBool(props)
{
  let name = props.name;

  return (
    <Form.Item
      label={name}
      name={name}
      key={name}
      valuePropName={"checked"}
      rules={[{required: props.required, message: {name},},]}
    >
      <Checkbox/>
    </Form.Item>)
}

function FormItemNodeId(props)
{
  //check if path exist to validate the input ? 
  let name = props.name;
  //set default file path as current path

  return (
    <Form.Item
      label={name}
      name={name}
      key={name}
      rules={[{required: props.required, message : 'Missing ' + name,},]}
    >
      <Input placeholder={"Enter file path"}  />
    </Form.Item>)
}

function FormItemAttributePath(props)
{
  let name = props.name;

  return (
    <Form.Item
      label={name}
      name={name}
      key={name}
      rules={[{required: props.required, message: {name},},]}
    >
      <Input placeholder={"Enter file path"} /> 
    </Form.Item>)
}

/**
 * Generate items for array subtype
 */
function FormItemStrings(props)
{
  let name = props.name;

  return (
     <Form.List name={name} >
        {(fields, { add, remove }, { errors }) => (
          <>
            {!fields.length  && (fields.push({ fieldKey : 0, isListField : true, key : 0, name : 0}) && null)}
            {fields.map((field, index) => (
              <Form.Item
                 name={[ index]}
                 rules={[{ required: props.required, message: 'Missing value' }]}
                 label={index === 0 ? props.name : ' '}
                 colon={index === 0 ? true : false}
                 key={index}
              >
                <div style={{ display: 'flex', alignItems : 'center', width:"100%"}} >
                  <Input style={{width:"90%"}} placeholder="Input value"/>
                  {fields.length > 1 ? (
                    <MinusCircleOutlined style={{color : 'white', marginLeft: 10}} title='remove item from list' onClick={() => remove(field.name)} />) : null}
                </div>
              </Form.Item>
            ))}

            <Form.Item label={' '} colon={false} key={'button' + name}>
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Add field
                </Button>
            </Form.Item>
          </>
        )}
      </Form.List>)
}

class FormItemNodesId extends React.Component
{
  constructor(props)
  {
    super(props);
    let selectedNode = props.selectedNode;
    this.state = { name : props.name, checkboxRequired : props.required, 
                   selectedNode : selectedNode, currentNode : props.currentNode };
  }

  componentDidUpdate(prevProps)
  {
    let selectedNode = this.props.selectedNode;
    if (prevProps !== this.props)
      this.setState({ name : this.props.name, checkboxRequired : this.props.required, 
                      selectedNode : selectedNode, currentNode : this.props.currentNode });
  }

  createItem(field, index, remove)
  {
    let selection = this.state.selectedNode.length;
    if (index === 0 && selection)
    {
      return(<Form.Item
               label={this.state.name}
               key={index}
               required={true}
             >
               <div style={{color:'white'}}>
                 <Form.Item valuePropName={"checked"} name={index} noStyle>
                   <Checkbox  />
                 </Form.Item>
                 &nbsp;&nbsp;&nbsp;Apply on selection ({this.state.selectedNode.length} files)
               </div>
             </Form.Item>)
    }
    else
    {
      let label = ' ';
      let colon = false;
      if (index === 0)
      {
        label = this.state.name;
        colon = true;
      }

      //we need to bind form item https://ant.design/components/form/#components-form-demo-complex-form-control
      //because it's a complex component
      return (<Form.Item
                label={label}
                colon={colon}
                key={index}
                required={true}
              >
                <div style={{ display: 'flex', alignItems : 'center', width:"100%"}} >
                  <Form.Item name={index} noStyle>
                     <Input style={{width:"90%"}}  placeholder="Input file path" />
                  </Form.Item>
                  <MinusCircleOutlined style={{color : 'white', marginLeft: 10}} title='remove item from list' onClick={() => remove(field.name)} />
                </div> 
              </Form.Item>)
    }
  }

  async validateFormList(_, values)
  {
    let selection = this.state.selectedNode.length;

    if (selection  === 0 && values.length === 0)
    {
      return Promise.reject(new Error('You must add at least one valid file path'));
    }
    else if (selection !== 0 && values.length === 0)
    {
      return Promise.reject(new Error('You must choose selection or add a valid file path'));
    }
    else if (selection  !== 0 && values.length === 1 && values[0] === false)
    {
      return Promise.reject(new Error('You must choose selection or add a valie file path'));
    }
    else 
    {
      let i = 0;
      if (selection >= 1) 
        i = 1;
      for (; i < values.length; i++)
      {
        let value = values[i];
        //check by getting id if node exists ? 
        if (!value || value === '')
        {
          return Promise.reject(new Error('Item ' + (i + 1) + ' is invalid'));
        }
      }
    }
  }

  addDefaultField(fields)
  {
    if (fields.length === 0)
    {
      fields.push({ fieldKey : 0, isListField : true, key : 0, name : 0});
    }
  }
  
  render()
  {
    let name = this.props.name;

    return (
      <Form.List 
        key={name} 
        name={name} 
        rules={[ { validator : this.validateFormList.bind(this)  },]}
      >
      {(fields, { add, remove }, { errors }) => (
        <>
          {this.addDefaultField(fields)} 
          {fields.map((field, index) => (
           <>
             {this.createItem(field, index, remove)}
           </> 
          ))}

          <Form.Item label={' '} colon={false} key={'button' + name}>
            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
              Add path 
            </Button>
          </Form.Item>
          <Form.ErrorList errors={errors} />
        </>
      )}
      </Form.List>)
  }
}

/**
 *  Plugin argument form
 */
class LaunchPluginForm extends React.Component
{
  formRef = React.createRef();

  constructor(props)
  {
    super(props);
    this.api = TapirAPI();

    let form = <div>Loading form</div>; 
    this.state = { form : form };
  }

  init()
  {
    this.initialValues = {};
  }

  componentDidMount() 
  {
    this.init();
    this.generateForm().then(form => 
    {
      this.setState({form : form});
    });
  }

  componentDidUpdate(prevProps) 
  {
    if ((prevProps.currentNode.id !== this.props.currentNode.id) || (prevProps.plugin !== this.props.plugin) || (prevProps.selectedNode !== this.props.selectedNode))
    {
      this.init();
      this.generateForm().then(form => 
      {
        this.formRef.current.setFieldsValue(this.initialValues);
        this.setState({form : form});
      });
    }
  }
  
  async formItem(arg_name, arg)
  {
    if (arg.type === 'NodeId')
    {
      let node_path = "";
      if (arg_name === 'mount_point')
      {
        node_path = "/root";
        this.initialValues[arg_name] = node_path;
      }
      else
      {
        let response = await this.api.node_path(this.props.currentNode.id);
        node_path = response.data;
        this.initialValues[arg_name] = node_path;
      }
      return (<FormItemNodeId key={arg_name} name={arg_name} required={arg.required} node_id={this.props.currentNode.id} node_path={node_path} />)
    }
    else if (arg.type === 'AttributePath')
    {
      let node_path = await this.api.node_path(this.props.currentNode.id);
      this.initialValues[arg_name] = node_path.data;
      return (<FormItemAttributePath key={arg_name} name={arg_name} required={arg.required} node_id={this.props.currentNode.id} node_path={node_path.data}  />)
    }
    else if (arg.type === 'string')
    {
      return (<FormItemString key={arg_name} name={arg_name} required={arg.required} />)
    }
    else if (arg.type === 'boolean')
    {
      return (<FormItemBool key={arg_name} name={arg_name} required={arg.required} />)
    }
    else if (arg.type === 'integer') 
    {
      return (<FormItemInteger key={arg_name} name={arg_name} required={arg.required} />)
    }
    else if (arg.type === 'object')
    {
      return (<FormItemString key={arg_name} name={arg_name} required={arg.required} />)
    }
    else if (arg.type === 'array')
    {
      if (arg.subtype === 'NodeId')
      {
        let node_path = await this.api.node_path(this.props.currentNode.id);
        if (this.props.selectedNode.length)
          this.initialValues[arg_name] = [false, node_path.data]; 
        else
          this.initialValues[arg_name] = [node_path.data];
        return (<FormItemNodesId key={arg_name} name={arg_name} required={arg.required} currentNode={node_path.data} selectedNode={this.props.selectedNode} />)
      }
      else if (arg.subtype === 'string') 
      {
        return (<FormItemStrings key={arg_name} name={arg_name} required={arg.required} />)
      }
    }
    notifyError('Plugin form error' + arg.type + ' ' + arg.subtype + " is not implemented");
    return (<FormItemString key={arg_name} name={arg_name} required={arg.required} />)
  }

  async generateForm()
  {
    let plugins_config = await PLUGINS_CONFIG;
    let config = plugins_config[this.props.plugin];

    if (config)
    {
      let args = config.arguments;
      let form_items = [];

      for (let argument_name in args)
      {
        let argument = args[argument_name];
        let form_item = await this.formItem(argument_name, argument);
        form_items.push(form_item);
      }
      let form = (<Form ref={this.formRef} id={this.props.formName} labelCol={{ span: 8, }}
          wrapperCol={{span: 16,}} initialValues={this.initialValues}
          onFinish={this.sendFormData.bind(this)}
          autoComplete="off"
        >
          {form_items}
        </Form>)
      return (form);
    }
    else
    {
      let error = "Can't find configuration for plugin : " + this.props.plugin;
      let form = <>{error}</>;
      return (form);
    }
  }

  async formReplaceValue(form)
  {
    let plugins_config = await PLUGINS_CONFIG;
    
      let config = plugins_config[this.props.plugin];
      let args = config.arguments;
      let newForm = {};

      for (const arg_name of Object.keys(form))
      {
        let argument = args[arg_name];
        let type = argument.type;
        let subtype = argument.subtype;
        if (type === 'NodeId')
        {
          let response = await this.api.node_by_path(form[arg_name]);
          newForm[arg_name] = response.data.id;
        }
        else if (type === 'AttributePath')
        {
          let response = await this.api.node_by_path(form[arg_name]);
          newForm[arg_name] = { node_id : response.data.id, attribute_name :  "data" }; 
        }
        else if (type === 'integer')
        {
          newForm[arg_name] = parseInt(form[arg_name]);
        }
        else if (type === 'array' && subtype === 'NodeId')
        {
          //if selection as argument first argument is for selection (true, false)
          //for each other we need to get the id then do the query 
          let newValues = [];
          let values = form[arg_name];
          for (let i = 0; i < values.length; ++i)
          {
            let value = values[i];
            if (i === 0 && this.props.selectedNode.length)
            { 
              if (value === true)
              {
                newValues.push(...this.props.selectedNode);
              }
            }
            else
            {
              try
              {
                let response = await this.api.node_by_path(value)
                newValues.push(response.data.id);
              }
              catch (e)
              {
                notifyError("Error in argument", "File path " +  value + " is invalid");
              }
            }
          }
          newForm[arg_name] = newValues;
        }
        else
        {
          newForm[arg_name] = form[arg_name];
        }
      } 
      return (newForm);
  }

  sendFormData(form)
  {
    this.formReplaceValue(form).then(form =>
    {
      this.props.onOk({ plugin : this.props.plugin, args : form});
    });
  }

  render()
  {
    const form = this.state.form;
    return (form)
  }
}

/**
 *  Plugin arguments selection modal 
 */
export default class LaunchPlugin extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = {plugin : props.plugin, visible : props.visible, onCancel : props.onCancel, onOk : props.onOk, currentNode : props.currentNode, selectedNode : props.selectedNode() };

  }

  componentDidUpdate(prevProps, prevState, snapshot)
  {
    if (prevProps.visible !== this.props.visible)
    {
      if (this.props.visible)
        this.setState({plugin : this.props.plugin, visible : this.props.visible, onCancel : this.props.onCancel, onOk : this.props.onOk, currentNode : this.props.currentNode, selectedNode : this.props.selectedNode() });
      else
        this.setState({visible : this.props.visible});
    }
  }

  render()
  {
    let formName = "LaunchPlugin" + this.props.browser_id;

    return (
        <Modal title={this.state.plugin} visible={this.state.visible} okButtonProps={{form: formName, key: 'submit', htmlType: 'submit'}} onCancel={this.state.onCancel}>
          <LaunchPluginForm onOk={this.state.onOk} formName={formName} plugin={this.state.plugin} currentNode={this.state.currentNode} selectedNode={this.state.selectedNode}  />
      </Modal>)
  }
}

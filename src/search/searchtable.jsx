import eventBus from '../utils/eventbus.js';
import NodesTable from '../table/nodestable.jsx';
import { notifyError } from '../utils/notification.jsx';

import { message } from 'antd'; 
import { withSize } from 'react-sizeme'

class SearchTable extends NodesTable 
{
  constructor(props)
  {
    super(props);
  }

  componentDidMount() 
  {
    eventBus.on("search_columns" + this.props.browser_id, this.onToolBarClick.bind(this))
    eventBus.on("search_query" + this.props.browser_id, this.onSearchClick.bind(this))
    eventBus.on("search_page" + this.props.browser_id, this.onSearchPage.bind(this))
    eventBus.on("addColumn" + this.props.browser_id, this.addColumn.bind(this));
    eventBus.on("export" + this.props.browser_id, this.exportSelection.bind(this));
  }

  componentWillUnmount() 
  {
    eventBus.remove("search_columns" + this.props.browser_id);
    eventBus.remove("search_query" + this.props.browser_id);
    eventBus.remove("search_page" + this.props.browser_id);
    eventBus.remove("addColumn" + this.props.browser_id);
    eventBus.remove("export" + this.props.browser_id);
  }

  onSearchPage(page)
  {
    this.setState({currentPage : page});
  }

  onSearchClick(query) 
  {
    this.setState({load : true});
    this.api.query("/root", query).then(response => 
    {
      //XXX if error set it to 0 or too large to display ...
      let nodes_id = response.data;
      this.api.nodes_by_id(nodes_id, true, false, true, false).then(response => 
      {
        eventBus.dispatch("search_result" + this.props.browser_id, response.data.length);
        this.setData(response.data);
        this.setState({ load : false }); 
        message.info('Search finished ! Found : ' + response.data.length + ' results ');
      })
      .catch(error => 
      {
        notifyError("Query error", "Error in response, request maybe too large");
        this.setState({ load : false });
      });
    })
    .catch(error =>
    {
      //check if error.reponse or it mean request has error
      notifyError("Query error", error.response.data);
      this.setState({ load : false }); 
    });
  }

  onToolBarClick(data)
  {
    if (data === "columns")
    {
      this.setState({ isModalVisible : true })
    }
  }
}

export default withSize({ monitorHeight: true })(SearchTable);

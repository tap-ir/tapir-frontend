import eventBus from '../utils/eventbus.js';
import NodesTable from '../table/nodestable.jsx';
import { notifyError } from '../utils/notification.jsx';

import { message } from 'antd'; 
import { withSize } from 'react-sizeme';
import moment from 'moment';

const TimelineColumns = [
  {
    title: 'Time',
    index : 'time',
    width: 160,
    closable : false,
  },
  {
    title: 'Attribute',
    index : 'attribute_name',
    width: 200,
    closable : false,
  },
  {
    title: 'Name', 
    index : 'name',
    width: 200,
    closable : false,
  },
]; 
 

class TimelineTable extends NodesTable 
{
  constructor(props) 
  {
    super(props, TimelineColumns);
    this.hasAttributes = false;
  }

  componentDidMount() 
  {
    eventBus.on("timeline_search" + this.props.browser_id, this.onTimelineClick.bind(this))
    eventBus.on("timeline_page" + this.props.browser_id, this.onTimelinePage.bind(this))
    eventBus.on("addColumn" + this.props.browser_id, this.addColumn.bind(this));
    eventBus.on("export" + this.props.browser_id, this.exportSelection.bind(this));
  }

  componentWillUnmount() 
  {
    eventBus.remove("timeline_search" + this.props.browser_id);
    eventBus.remove("timeline_page" + this.props.browser_id);
    eventBus.remove("addColumn" + this.props.browser_id);
    eventBus.remove("export" + this.props.browser_id);
  }

  //we modify add column, so we get data attributes only if we had some column
  //timeline can be very big so it avoid serializing attributes by default
  addColumn(attributeName)
  {
    if (!this.hasAttribute)
    {
      this.setState({ load : true })
      this.onTimelineClick(this.currentDate, true);
    }

    //can we call parent function so if code change it's still ok ? this.parentObject.addColumn ?
    let columns = this.originalColumns; 
    let name = attributeName.split('.').at(-1);
    name = name.charAt(0).toUpperCase() + name.slice(1);
    columns.push(this.createColumn(name, attributeName, 200));
    this.setState({ columns : columns })
  }

  onTimelinePage(page)
  {
    this.setState({currentPage : page});
  }

  onTimelineClick(date, attributes = false)
  {
    if (this.state.columns.length > 3)
      attributes = true;

    if (date != null && date.length === 2 && date[0] != null && date[1] != null)
    {
      this.setState({load : true});
      this.currentDate = date;
      let start = moment(date[0]).utcOffset(0, true).format()
      let end = moment(date[1]).utcOffset(0, true).format()
      this.api.timeline(start, end, true, false, attributes, false).then(response => 
      {
        //XXX if error set it to 0 or too large to display ...
        //send event to display the pagination and number of results
        eventBus.dispatch("timeline_result" + this.props.browser_id, response.data.length);
        //each row need a specific key, we can't use node id as we have multiple time the same node displayed
        if (attributes)
          this.hasAttribute = true;
        else
          this.hasAttribute = false;
        this.setData(response.data);
        this.setState({ load : false }); 
        message.info('Timeline finished ! Found : ' + response.data.length + ' results ');
      })
      .catch(error =>
      {
        notifyError("Query error", error.response.data);
        this.setState({ load : false }); 
      });
    }
  }
}

export default withSize({ monitorHeight: true })(TimelineTable)

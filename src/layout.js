export var AppLayout = {
    global: {
      tabEnableClose:true, 
      rootOrientationVertical:true,
      //tabEnableFloat : true, 
      //"tabSetEnableClose":true,
    },
    //borders:[
        //{
					//"type": "border",
          //"location":"bottom",
          //"size": 100,
          //"children": [
              //{
              //"type": "tab",
              //"name": "four",
              //"component": "text"
              //}
            //]
        //},
        //{
          //"type": "border",
          //"location":"left",
          //"size": 100,
          //"children": []
         //}
    //],
    layout: {
        "type": "row",
        "weight": 100,
        "children": [
            {
                "type": "tabset",
                "weight": 65,
                "selected": 0,
                "active" : true,
                "children": [
                    {
                        "type": "tab",
                        "name": "Browser",
                        "component": "browser"
                        //"icon":"images/bar_chart.svg"
                    },
                    {
                        "type": "tab",
                        "name": "Timeline",
                        "component": "timeline"
                    },
                    {
                        "type": "tab",
                        "name": "Search",
                        "component": "search"
                    },
                ]
            },
            {
                "type": "tabset",
                "weight": 35,
                "selected": 0,
                "children": [
                    {
                        "type": "tab",
                        "name": "Viewer",
                        "component": "viewer",
                        "enableClose" : false,
                        "enableFloat" : true,
                    },
                    {
                        "type": "tab",
                        "name": "Tasks",
                        "component": "tasks"
                    },
                    {
                        "type": "tab",
                        "name": "Plugins",
                        "component": "plugins"
                    },
                ]
            }
        ]
    }
};

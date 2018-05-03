import React, { Component } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import Select from 'react-select';
import 'react-select/dist/react-select.css';

// store private Todoist API key
import TodoistAPIkey from './key.json';

class App extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            tasks:{},
            projects:{},
            widgets: {               
                widget_0: { selected_project_id: 0, theme: 0}
            },
            widget_themes: ["list","tiles"]
            
        }
        
        
        
        //nuke button
        //localStorage.removeItem("widget-states");
    }
    
     componentDidMount() {
        
        this.loadFromTodoist();
         
        if (localStorage.getItem('widget-states') != null)
         
        this.setState({ 
            widgets: JSON.parse(localStorage.getItem('widget-states'))
        });
         
        setInterval(this.loadFromTodoist, 3000);
         
      }
    
    loadFromTodoist = () => {
        console.log("Loading new data from Todoist.");
        
        
        var todoist_URL = "https://todoist.com/API/v7/sync";
        var todoist_api_token = TodoistAPIkey.key;
        var todoist_sync_token = "%27*%27"; 
        var todoist_resource_types = '[%22items%22, %22projects%22]';
       
        var query = todoist_URL+"?token=" + todoist_api_token + "&sync_token="+todoist_sync_token+"&resource_types="+todoist_resource_types;
          
        fetch(query)
        .then((response) => {
            return response.json();
        })
        .then((data) => {
//            console.log(data);
            this.setState({
                tasks: data.items,
                projects: data.projects
            });
        });
        
        
    }
      
    
    
    selectProject = (widget_id, selected_project_id) => {   
        this.setState({
            widgets: {
                ...this.state.widgets, // keep old widgets
                [widget_id]: {
                    selected_project_id: selected_project_id,
                    theme: this.state.widgets[widget_id].theme
                } // overwrite this one
            }
        }, this.saveWidgets);
        
    
        
    }
    
    deleteWidget = (widget_id) => {
        let widgets = {};        
        
        for (let w in this.state.widgets) {
            
        
            if (w != widget_id) {
                widgets[w] = {
                    selected_project_id: this.state.widgets[w].selected_project_id,
                    theme: this.state.widgets[w].theme
                };
            }
        }
        
        
        this.setState({ widgets: widgets }, this.saveWidgets);    
    }
    
    saveWidgets = () => {        
        //save widget arrangement to local storage
        localStorage.setItem('widget-states', JSON.stringify(this.state.widgets)); 
    }
  
    createNewWidget = () => {
        
        let widgetCount = 0;
        
        while (this.state.widgets["widget_"+widgetCount]!= null) {
            widgetCount+=1;
        }
       
        
        this.setState({
            widgets: {
                ...this.state.widgets, // keep old widgets
                ["widget_"+widgetCount]: {selected_project_id: 0, theme: 0} // overwrite this one
            }
        }, this.saveWidgets);
    }
    
    changeWidgetTheme = (widget_id) => {
        
        
        let theme_options = this.state.widget_themes.length;        
        let w = this.state.widgets[widget_id];
        
        this.setState({
            widgets: {
                ...this.state.widgets, // keep old widgets
                [widget_id]: {
                    selected_project_id: w.selected_project_id,
                    theme: (w.theme+1)%theme_options      
                } // overwrite this one
            }
        }, this.saveWidgets);
        
    }
    
    render() {
        
        let widgets_to_render = [];
        
        for (let key in this.state.widgets){
            widgets_to_render.push(
                <CSSTransition key={key} classNames="widgetTransition" timeout={{ enter: 200, exit: 200 }}>
                  <TaskList 
                      tasks = {this.state.tasks} 
                      projects = {this.state.projects} 
                      widget_id = {key} 
                      selected_project_id = {this.state.widgets[key].selected_project_id} 
                      theme={this.state.widgets[key].theme} 
                      widget_themes={this.state.widget_themes} 
                      selectProject={this.selectProject} 
                      deleteWidget={this.deleteWidget} 
                      changeWidgetTheme={this.changeWidgetTheme}/> 
                </CSSTransition>
            );
        }   
        
        
        return (
            <div>
                <header><button id="new-widget" onClick={this.createNewWidget}>+</button></header>
                <div id="noteSection">
                    <TransitionGroup component={null}>
                        {widgets_to_render}
                    </TransitionGroup>
                </div>
            </div>
        );
    }
}

export default App;



class TaskList extends React.Component {
    
    constructor(props) {
        super(props);
    }
    
    selectProject = (e) => {
        this.props.selectProject(this.props.widget_id, e.value);
    }
    
    deleteWidget = () => {
        this.props.deleteWidget(this.props.widget_id);        
    }
    
    changeWidgetTheme = () => {
        this.props.changeWidgetTheme(this.props.widget_id);
    }
    
    render() {
    
        let tasks_to_render = [];
        let projects_to_render = [];
        
        for (let key in this.props.projects){
            projects_to_render.push(
              { 
                  value: this.props.projects[key].id, 
                  label: this.props.projects[key].name 
              }
            );
        }          
        
        if (this.props.selected_project_id) {
            for (let key in this.props.tasks){
                let current_task = this.props.tasks[key];
                if (current_task.project_id == this.props.selected_project_id) {                    
                    tasks_to_render.push(
                      <li>{current_task.content}</li>
                    );
                }  
            }
        }

        return (
            <div className={"notePanel "+this.props.widget_themes[this.props.theme]}>
                <Select 
                    onChange={this.selectProject}
                    options= {projects_to_render}
                    clearable ={false}
                    searchable = {false}
                    value={this.props.selected_project_id}
                />
                <ul onClick={this.changeWidgetTheme}>
                    {tasks_to_render}
                </ul>
                <div className="deleteWidgetButton" onClick={this.deleteWidget}></div>
            </div>
        );

    }

}

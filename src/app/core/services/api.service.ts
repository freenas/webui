import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { WebSocketService } from '../../services/ws.service';
import { RestService } from '../../services/rest.service';
import { CoreService, CoreEvent } from './core.service';

interface ApiCall {
  namespace: string; // namespace for ws and path for rest
  args?: any;
  operation?: string;
  responseEvent ?: any;// The event name of the response this service will send
}

interface ApiDefinition { 
  apiCall: ApiCall;
  preProcessor?: (def:ApiCall) => ApiCall;
  postProcessor?: (def:ApiCall) => ApiCall;
}

@Injectable()
export class ApiService {

  private apiDefinitions = {
    PoolDataRequest:{
      apiCall:{
        protocol:"rest",
        version:"1.0",
        operation: "get",
        namespace: "storage/volume/",
        responseEvent: "PoolData"
      }
    },
    PoolDisksRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"pool.get_disks",
        args: [],
        responseEvent: "PoolDisks"
      }
    },
    NetInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"network.general.summary",
        args: [],
        responseEvent: "NetInfo"
      }
    },
    UpdateCheck:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"update.check_available",
        args: [],
        responseEvent: "UpdateChecked"
      }
    },
    VmProfilesRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0", // Middleware returns device info but no status
        namespace: "vm.query",
        //args: [],
        responseEvent: "VmProfiles"
      }
    },
    VmProfileRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"vm.query",
        args: [],// eg. [["id", "=", "foo"]]
        responseEvent: "VmProfile"
      }
    },
    VmProfileUpdate:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"vm.update",
        args: [],// eg. [25, {"name": "Fedora", "description": "Linux", "vcpus": 1, "memory": 2048, "bootloader": "UEFI", "autostart": true}]
        responseEvent: "VmProfileRequest"
      },
      postProcessor(res){
        console.log(res);
        let cloneRes = Object.assign({},res);
        cloneRes = [[["id","=",res]]];// eg. [["id", "=", "foo"]]
        return cloneRes;
      }
    },
    VmStatusRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"vm.status",
        args: [],// eg. [["id", "=", "foo"]]
        responseEvent: "VmStatus"
      }
    },
    VmStart:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.start",
        args:[],
        responseEvent:"VmStarted"
      }
    },
    VmStop:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.stop",
        args:[],
        responseEvent:"VmStopped"
      }
    },
    VmCreate:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.create",
        args:[],
        responseEvent:"VmCreated"
      }
    },
    VmDelete:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"vm.delete",
        args:[],
        responseEvent:"VmDeleted"
      }
    },
    SysInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"system.info",
        args:[],
        responseEvent:"SysInfo"
      }
    },
    /*NetInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_sources",
        args:[],
        responseEvent:"NetInfo"
      }
    },*/
    StatsRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      }
    },
    StatsCpuRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        let redef = Object.assign({}, def);
        //Do some stuff here
        let dataList = [];
        let oldDataList = redef.args[0];
        let options = redef.args[1];

        for(let i in oldDataList){
          dataList.push({
            source:"aggregation-cpu-sum",
            type:"cpu-" + oldDataList[i],
            dataset:"value"
          });
        }

        redef.args = [dataList,options];
        redef.responseEvent = 'StatsCpuData';
        return redef;
      },
      postProcessor(res){
        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          let spl = legend[i].split("aggregation-cpu-sum/cpu-");
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      }
    },
    StatsMemoryRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        let redef = Object.assign({}, def);
        //Do some stuff here

        let dataList = [];
        let oldDataList = redef.args[0];
        let options = redef.args[1];

        for(let i in oldDataList){
          dataList.push({
            source:"memory",
            type:"memory-" + oldDataList[i],
            dataset:"value"
          });
        }

        redef.args = [dataList,options];
        redef.responseEvent = 'StatsMemoryData';
        return redef;
      },
      postProcessor(res){
        console.log("******** MEM STAT RESPONSE ********");
        console.log(res);

        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          let spl = legend[i].split("memory/memory-");
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      }
    },
    StatsDiskTempRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        //Clone the object
        let redef = Object.assign({}, def);
        let dataList = [];
        let oldDataList = redef.args[0];

        for(let i in oldDataList){
          dataList.push({
            source:"disktemp-" + oldDataList,// disk name
            type:"temperature",
            dataset:"value"
          });
        }

        redef.args = [dataList];
        redef.responseEvent = 'StatsDiskTemp';
        return redef;
      },
      postProcessor(res){
        //console.log("******** DISK TEMP RESPONSE ********");
        //console.log(res);

        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          let spl = legend[i];
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      }
    },
    StatsLoadAvgRequest:{
      apiCall:{
        protocol:"websocket",
        version:"1",
        namespace:"stats.get_data",
        args:[],
        responseEvent:"StatsData"
      },
      preProcessor(def:ApiCall){
        let redef = Object.assign({}, def);
        //Do some stuff here
        let dataList = [];
        let oldDataList = redef.args[0];
        let options = redef.args[1];

        for(let i in oldDataList){
          dataList.push({
            source:"processes",
            type:"ps_" + oldDataList[i],
            dataset:"value"
          });
        }

        redef.args = [dataList,options];
        redef.responseEvent = 'StatsLoadAvgData';
        return redef;
      },
      postProcessor(res){
        console.log("******** LOAD STAT RESPONSE ********");
        console.log(res);
        //return res;

        let cloneRes = Object.assign({},res);
        let legend = res.meta.legend;
        let l = [];
        for(let i in legend){
          let spl = legend[i].split("processes/ps_state-");
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      }
    },
    StatsVmemoryUsageRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"vm.get_vmemory_in_use",
        args: [],// eg. [["id", "=", "foo"]]
        responseEvent: "StatsVmemoryUsage"
      }
    },
    DisksInfoRequest:{
      apiCall:{
        protocol:"websocket",
        version:"2.0",
        namespace:"disk.query",
        args: [],
        responseEvent: "DisksInfo"
      }
    },
  } 

  constructor(protected core: CoreService, protected ws: WebSocketService,protected     rest: RestService) {
    console.log("*** New Instance of API Service ***");
    this.registerDefinitions();
  }

  registerDefinitions(){
    //DEBUG: console.log("APISERVICE: Registering API Definitions");
    for(var def in this.apiDefinitions){
      //DEBUG: console.log("def = " + def);
      this.core.register({observerClass:this, eventName:def}).subscribe(
        (evt:CoreEvent) => {
          //Process Event if CoreEvent is in the api definitions list
          if(this.apiDefinitions[evt.name]){
            //DEBUG: console.log(evt);
            let apiDef = this.apiDefinitions[evt.name];
            //DEBUG: console.log(apiDef)
            //let call = this.parseCoreEvent(evt);
            if(apiDef.apiCall.protocol == 'websocket'){
              this.callWebsocket(evt,apiDef);
            } else if(apiDef.apiCall.protocol == 'rest'){
              this.callRest(evt,apiDef);
            }
          }
        },
        (err) => {
          //DEBUG: console.log(err)
          });
    }
  }

  private callRest(evt,def){
    let baseUrl = "/api/v" + def.apiCall.version + "/";
    let cloneDef = Object.assign({},def);
    if(evt.data){
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if(def.preProcessor){
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      let call = cloneDef.apiCall;//this.parseEventRest(evt);
      call.args = evt.data;
      this.rest[call.operation](baseUrl + call.namespace, evt.data, false).subscribe((res) => {
        //DEBUG: console.log("*** API Response:");
        //DEBUG: console.log(res)

        // PostProcess
        if(def.postProcessor){
          res = def.postProcessor(res);
        }

        this.core.emit({name:call.responseEvent,data:res.data, sender: evt.data});
      });
    } else {
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if(def.preProcessor){
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      let call = cloneDef.apiCall;//this.parseEventRest(evt);
      call.args = evt.data;
      this.rest[call.operation](baseUrl + call.namespace,{}, false).subscribe((res) => {
        //DEBUG: console.log("*** API Response:");
        //DEBUG: console.log(call);

        // PostProcess
        if(def.postProcessor){
          res = def.postProcessor(res);
        }

        this.core.emit({name:call.responseEvent,data:res.data, sender: evt.data});
      });
    }

  }

  private callWebsocket(evt:CoreEvent,def){
    let cloneDef = Object.assign({}, def);

    if(evt.data){
      cloneDef.apiCall.args = evt.data;

      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if(def.preProcessor){
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      let call = cloneDef.apiCall;//this.parseEventWs(evt);
      this.ws.call(call.namespace, call.args).subscribe((res) => {
        //DEBUG: console.log("*** API Response:");
        //DEBUG: console.log(call)

        // PostProcess
        if(def.postProcessor){
          res = def.postProcessor(res);
        }
        console.log(call.responseEvent);
        console.log(res);
        this.core.emit({name:call.responseEvent, data:res, sender: evt.data});
      });
    } else {
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if(def.preProcessor){
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      let call = cloneDef.apiCall;//this.parseEventWs(evt);
      this.ws.call(call.namespace).subscribe((res) => {
        //DEBUG: console.log("*** API Response:");
        //DEBUG: console.log(call);

        // PostProcess
        if(def.postProcessor){
          res = def.postProcessor(res);
        }

        this.core.emit({name:call.responseEvent, data:res, sender:evt.data });
      });
    }
  }

}

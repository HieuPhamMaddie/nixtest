"use strict";
const command = require("@pulumi/command");
var Promise = require("bluebird");
const {getPriKey , createServer} = require('./utils/utils.js');

const dropletAppCount = 2;
const droplets = [];

//create the monitor server
const grafana_server =createServer("grafana","monitor");
droplets.push(grafana_server);

//create app server
for(let i = 0 ; i < dropletAppCount ; i++){
  const appName = "App-" + i;
  const app_server = createServer(appName,"monitoring");
  droplets.push(app_server);
};


const rebuild = async () => {
  await Promise.mapSeries(droplets ,async droplet => {
  droplet.ipv4Address.apply(ipv4 => {
    const connection = {
      host: ipv4,
      user: "root",
      dialErrorLimit : -1,
      privateKey: getPriKey()
    };
    new command.remote.Command(ipv4, {
      connection: connection,
      create: "nixos-rebuild switch; cd /root/app; docker-compose up -d",
    });
    
  }); 
  });
}


rebuild();
exports.grafana_ip = grafana_server.ipv4Address;









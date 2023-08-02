"use strict";
const pulumi = require("@pulumi/pulumi");
const digitalocean = require("@pulumi/digitalocean");
const command = require("@pulumi/command");
var Promise = require("bluebird");
const fs = require("fs");


const getPriKey = () => {
  const key = fs.readFileSync("./sshkeys/priv", "utf8");
  return key.toString();
};

const initConfigServer = (type) => {
  const nixConfig = fs.readFileSync('configuration.nix').toString();
  let script = `#!/usr/bin/env sh
  echo "${nixConfig}" > /etc/nixos/configuration.nix
  `
  if(type == "monitor"){
    let monitorDockerCompose = fs.readFileSync('docker/monitor_server/docker-compose.yml').toString();
    let prometheusYml = fs.readFileSync('docker/monitor_server/prometheus.yml').toString();
    script = `${script}
    mkdir /root/app/
    echo "${monitorDockerCompose}" > /root/app/docker-compose.yml
    echo "${prometheusYml}" > /root/app/prometheus.yml
   `
  }else {
    let monitoringDockerCompose = fs.readFileSync('docker/app_server/docker-compose.yml').toString();
    script = `${script}
    mkdir /root/app/
    echo "${monitoringDockerCompose}" > /root/app/docker-compose.yml
   `
  }
  return script;
};

const sshKey = digitalocean.getSshKey({
        name: "hieuphamssh",
});

const createServer = (servername , servertag) => {
  return new digitalocean.Droplet(servername , {
    image: "137610103",
    region: "sgp1",
    size: "s-1vcpu-1gb",
    sshKeys: [sshKey.then(key => key.id)],
    tags: [servertag],
    userData: initConfigServer("monitor"),
  })
}

const droplets = [];
const grafana_server =createServer("grafana","monitor");
const app_server = createServer("app","monitoring");

droplets.push(grafana_server);
droplets.push(app_server);


const rebuild = async () => {
  await Promise.mapSeries(droplets ,async droplet => {
  const connection = {
    host: droplet.ipv4Address,
    user: "root",
    privateKey: getPriKey()
  };
  const commandName = Date.now().toString();
  new command.remote.Command(commandName, {
    connection: connection,
    create: "nixos-rebuild switch; cd /root/app; docker-compose up -d",
  });

  });
}


rebuild();
exports.grafana_ip = grafana_server.ipv4Address;
exports.app_ip = app_server.ipv4Address;







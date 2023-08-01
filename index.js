"use strict";
const pulumi = require("@pulumi/pulumi");
const digitalocean = require("@pulumi/digitalocean");
const command = require("@pulumi/command");
const fs = require("fs");

const getPriKey = () => {
  const key = fs.readFileSync("./sshkeys/priv", "utf8");
  return key.toString();
};

const getUserData = (file_path) => {
  const data = fs.readFileSync(file_path).toString();
  const script = `#!/usr/bin/env sh
  echo "${data}" > /etc/nixos/configuration.nix
  mkdir /root/test
  touch /root/test/docker-compose.yml
  touch /root/test/prometheus.yml
  `
  return script;
};

const sshKey = digitalocean.getSshKey({
        name: "hieuphamssh",
});

const grafana_server = new digitalocean.Droplet(`grafana`, {
        image: "137610103",
        region: "sgp1",
        size: "s-1vcpu-1gb",
        sshKeys: [sshKey.then(key => key.id)],
        tags: ["monitoring"],
        userData: getUserData('configuration.nix'),
});

const connection = {
  host: grafana_server.ipv4Address,
  user: "root",
  privateKey: getPriKey(),
};

const rebuildCommand = new command.remote.Command("rebuild-command", {
  connection: connection,
  create: "nixos-rebuild switch",
});


// const test_server1 = new digitalocean.Droplet(`test1`, {
//         image: "137610103",
//         region: "sgp1",
//         size: "s-1vcpu-1gb",
//         sshKeys: [sshKey.then(key => key.id)],
//         tags: ["monitoring"],
// });


// const connection1 = {
//   host: test_server1.ipv4Address,
//   user: "root",
//   privateKey: getPriKey(),
// };

// const rebuildCommand1 = new command.remote.Command("rebuild-command1", {
//   connection: connection,
//   create: "nixos-rebuild switch",
// });


exports.grafana_ip = grafana_server.ipv4Address;
// exports.test_ip = test_server1.ipv4Address;







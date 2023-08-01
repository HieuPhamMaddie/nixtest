{ modulesPath,pkgs, ... }: {
    imports = [ \"\${modulesPath}/virtualisation/digital-ocean-config.nix\" ];
    environment.systemPackages = with pkgs; [
    cloud-init
    docker
    htop gzip zip unzip curl wget
    docker-compose 
    git
    ];
    services.cloud-init = {
      enable = true;
    };
    virtualisation.docker.enable = true;
    networking = {
    firewall.allowedTCPPorts = [
      3000  # grafana
      9090  # prometheus
      9100  # node_exporter
      8080  # cadvisor
    ];
    useDHCP = true;
    };
}
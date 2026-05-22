{
  description = "bun-ghovas";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ inputs.treefmt-nix.flakeModule ];
      systems = [
        "x86_64-linux"
        "aarch64-darwin"
      ];

      perSystem =
        {
          config,
          pkgs,
          ...
        }:
        let
          bun =
            if pkgs.stdenv.isLinux then
              pkgs.symlinkJoin {
                name = "bun";
                paths = [
                  (pkgs.writeShellScriptBin "bun" ''
                    exec systemd-run --user --scope -p MemoryMax=8G -p MemorySwapMax=0 ${pkgs.bun}/bin/bun "$@"
                  '')
                  (pkgs.writeShellScriptBin "bunx" ''
                    exec systemd-run --user --scope -p MemoryMax=8G -p MemorySwapMax=0 ${pkgs.bun}/bin/bunx "$@"
                  '')
                  pkgs.bun
                ];
              }
            else
              pkgs.bun;
        in
        {
          devShells.default = pkgs.mkShell {
            inputsFrom = [ config.treefmt.build.devShell ];
            packages = [ bun ];
          };

          treefmt = {
            projectRootFile = "flake.nix";
            programs.nixfmt.enable = true;
          };
        };
    };
}

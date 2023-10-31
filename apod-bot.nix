{ pkgs, rustPlatform }:

rustPlatform.buildRustPackage {
	pname = "apod-bot";
	version = "0.1.0";

	src = ./.;
	cargoLock.lockFile = ./Cargo.lock;

	nativeBuildInputs = [ pkgs.pkg-config ];
	buildInputs = [ pkgs.openssl ];
}

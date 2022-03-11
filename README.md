## Motif - Land Subgraph

1. Install repo
	update package.json with latest motif-item, motif-listing, motif-sdk
	yarn
	sudo apt-get install libsecret-1-dev
2. Update subgraph 
    update subgraph.yaml with data you got from motif-item, motif-itemListing
		update network, address, startblock. 
		starblock is the block you want indexing to start
3. Prepare subgraph to deploy
	clone the repo to server
	Install Yarn
		curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
		echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
		sudo apt update && sudo apt install yarn
		yarn 
		npm install -g @graphprotocol/graph-cli
		sudo apt-get install libsecret-1-dev
	make sure graph node runs as stated in motif-thegraph-node
	make sure ipfs port is not allowed
		sudo ufw deny 5001 
4. Deploy subgraph
	create subgraph
		nano subgraph.yaml
		paste subgraph.yaml updated as above
	copy the abis from Asset and Listing repos to abi folder
	yarn codegen 
	yarn create-local
	yarn deploy-local
	note the subgraph endpoints: 
		Queries (HTTP):     http://localhost:8000/subgraphs/name/motif-marketplace-subgraph
		Subscriptions (WS): http://localhost:8001/subgraphs/name/motif-marketplace-subgraph
	allow 8000 port on server
		sudo ufw allow 8000

 
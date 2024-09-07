import * as THREE from 'three';

class MeshTile{
    constructor(scene){
        const self = this;
        self.scene = scene;
        self.instancedTiles = [];
        self.instancedMesh;
        

        self.reuseableMatrix = new THREE.Matrix4();
    }
    addInstance(instancedTile){
        const self = this;
        instancedTile.added = true;
        instancedTile.listOMesh = self.instancedTiles;
        self.instancedTiles.push(instancedTile);
        if(self.instancedMesh){
            instancedTile.loadMesh(self.instancedMesh)
        }
    }

    addToScene(){
        //this.instancedMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
        const self = this;
        self.instancedMesh.setMatrixAt(0,new THREE.Matrix4());
        self.instancedMesh.instanceMatrix.needsUpdate = true;
        self.instancedMesh.count = 1;
        
        self.scene.add(self.instancedMesh);
        self.instancedMesh.onAfterRender = () => {
            delete self.instancedMesh.onAfterRender;
            self.instancedMesh.displayedOnce = true;
        };
    }

    setObject(instancedMesh){
        const self = this;
        self.instancedMesh = instancedMesh;
        self.instancedMesh.matrixAutoUpdate = false;
        self.instancedMesh.matrixWorldAutoUpdate = false;
        if(!self.scene.children.includes(instancedMesh)){
            this.addToScene();
        }
        
        for(let i = 0; i<self.instancedTiles.length; i++){
            self.instancedTiles[i].loadMesh(self.instancedMesh)
        }
    }

    update(){
        const self = this;

        for(let i = self.instancedTiles.length-1; i>=0; i--){
            if(self.instancedTiles[i].deleted){
                self.instancedTiles.splice(i,1);
            }
        }
        
        if(!!self.instancedMesh){
            
            self.instancedMesh.count = 0;
            self.instancedMesh.instancedTiles = [];
            for(let i = 0; i<self.instancedTiles.length; i++){
                self.instancedTiles[i].meshContent.add(self.instancedMesh);
                if(self.instancedTiles[i].materialVisibility){
                    self.instancedMesh.count++;
                    self.reuseableMatrix.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1);
                    self.reuseableMatrix.multiply(self.instancedTiles[i].matrixWorld);
                    self.reuseableMatrix.multiply(self.instancedMesh.baseMatrix);
                    //self.reuseableMatrix.premultiply(self.instancedTiles[i].master.matrixWorld);
                    self.instancedMesh.setMatrixAt(self.instancedMesh.count-1, self.reuseableMatrix );
                    //self.instancedMesh.getMatrixAt(0, t);
                    //console.log(self.instancedMesh.baseMatrix)
                    self.instancedMesh.instancedTiles.push(self.instancedTiles[i])
                }
            }
            
            self.instancedMesh.instanceMatrix.needsUpdate = true;
            self.instancedMesh.needsUpdate = true;
            self.instancedMesh.computeBoundingSphere();
        }
    }

    getCount(){
        return this.instancedTiles.length;
    }

    dispose(){
        const self = this;
        if(self.instancedTiles.length>0){
            return false;
        }
        else{
            if(!!self.instancedMesh){
                //console.log(self.instancedMesh.parent)
                self.scene.remove(self.instancedMesh);
                self.instancedMesh.traverse((o) => {
                    if(o.dispose) o.dispose();
                    if (o.material) {
                        // dispose materials
                        if (o.material.length) {
                            for (let i = 0; i < o.material.length; ++i) {
                                o.material[i].dispose();
                            }
                        }
                        else {
                            o.material.dispose()
                        }
                    }
                    if (o.geometry) o.geometry.dispose();
                });
                self.instancedMesh.dispose();
                return true;
            }
            return false;
        }
    }

}export { MeshTile };
// FIXED: blockchain/services/blockchain.js
const supabase = require('../../supabaseClient');
const { cryptoService } = require('../utils/crypto');
const ipfsService = require('./ipfsService');
const timestampService = require('./timestampService');
const auditService = require('./auditService');

class Blockchain {
  constructor() {
    this.secret = process.env.BLOCKCHAIN_SECRET;
    this.networkId = process.env.BLOCKCHAIN_NETWORK_ID;
    this.difficulty = parseInt(process.env.BLOCKCHAIN_DIFFICULTY) || 4;
    this.initialized = false;
  }

  async initialize() {
    cryptoService.initialize();
    try {
      await ipfsService.initialize();
    } catch (error) {
      console.error('⚠️ IPFS initialization failed:', error.message);
    }

    const { count, error } = await supabase.from('blockchain_blocks').select('*', { count: 'exact', head: true });
    if (error) {
      console.error('Error counting blocks:', error);
    } else if (count === 0) {
      await this.createGenesisBlock();
    }

    this.initialized = true;
  }

  async createGenesisBlock() {
    const genesisData = {
      message: 'E-Court Blockchain Genesis Block',
      system: 'Legal Case Management',
      version: '2.0',
      timestamp: new Date().toISOString()
    };

    const genesisHash = cryptoService.generateGenesisHash();
    
    const genesisBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      data: genesisData,
      previous_hash: '0',
      hash: genesisHash,
      nonce: 0,
      network_id: this.networkId,
      data_type: 'case_filing',
      entity_id: 'GENESIS',
      user_id: 'SYSTEM',
      user_type: 'admin',
      merkle_root: cryptoService.createMerkleRoot(genesisData)
    };

    await supabase.from('blockchain_blocks').insert([genesisBlock]);
  }

  async getLatestBlock() {
    const { data, error } = await supabase
      .from('blockchain_blocks')
      .select('*')
      .order('index', { ascending: false })
      .limit(1)
      .single();
    return data;
  }

  async mineBlock(data, dataType, entityId, userId, userType) {
    if (!this.initialized) throw new Error('Blockchain not initialized');

    const latestBlock = await this.getLatestBlock();
    const newIndex = latestBlock.index + 1;
    const timestamp = new Date().toISOString();

    const merkleRoot = cryptoService.createMerkleRoot(data);
    let nonce = 0;
    let hash = '';

    do {
      hash = cryptoService.calculateHashWithMerkle(
        newIndex,
        latestBlock.hash,
        new Date(timestamp),
        data,
        nonce,
        this.secret,
        merkleRoot
      );
      nonce++;
    } while (!cryptoService.hashMatchesDifficulty(hash, this.difficulty));

    const newBlock = {
      index: newIndex,
      timestamp,
      data,
      previous_hash: latestBlock.hash,
      hash,
      nonce: nonce - 1,
      network_id: this.networkId,
      data_type: dataType,
      entity_id: entityId,
      user_id: userId,
      user_type: userType,
      merkle_root: merkleRoot,
      ipfs: {},
      signature: {}
    };

    if (cryptoService.privateKey) {
      try {
        const { signature, publicKeyFingerprint } = cryptoService.signBlock({
          index: newIndex,
          timestamp: new Date(timestamp),
          data,
          previousHash: latestBlock.hash,
          merkleRoot
        });
        newBlock.signature = { value: signature, algorithm: 'SHA256withRSA', publicKeyFingerprint };
      } catch (error) {
        console.error('⚠️ Failed to sign block:', error.message);
      }
    }

    try {
      if (ipfsService.useIPFS && ipfsService.client) {
        const ipfsAnchorData = await ipfsService.anchorBlock({ ...newBlock, previousHash: newBlock.previous_hash });
        if (ipfsAnchorData && ipfsAnchorData.cid) {
          newBlock.ipfs = { cid: ipfsAnchorData.cid, anchoredAt: new Date().toISOString() };
        }
      }
    } catch (error) {
      console.error('❌ IPFS anchoring failed:', error.message);
    }

    const { data: savedBlock, error: saveError } = await supabase.from('blockchain_blocks').insert([newBlock]).select().single();
    if (saveError) throw saveError;

    try {
      await auditService.createCheckpoint({ ...savedBlock, previousHash: savedBlock.previous_hash });
    } catch (error) {
      console.error('⚠️ Failed to create audit checkpoint:', error.message);
    }

    return savedBlock;
  }

  async getBlocksByEntity(entityId) {
    const { data, error } = await supabase
      .from('blockchain_blocks')
      .select('*')
      .eq('entity_id', entityId)
      .order('index', { ascending: true });
    return data || [];
  }

  async getChainStats() {
    const { count: totalBlocks, error: countError } = await supabase.from('blockchain_blocks').select('*', { count: 'exact', head: true });
    const latestBlock = await this.getLatestBlock();
    
    const { data: typeData } = await supabase.rpc('get_blocks_by_type_count'); // Assuming an RPC or manual count
    
    // Fallback manual count for stats if RPC not available
    const { data: allBlocks } = await supabase.from('blockchain_blocks').select('data_type, ipfs, signature');
    
    const ipfsAnchoredBlocks = allBlocks?.filter(b => b.ipfs?.cid).length || 0;
    const signedBlocks = allBlocks?.filter(b => b.signature?.value).length || 0;

    return {
      totalBlocks,
      latestBlockIndex: latestBlock ? latestBlock.index : 0,
      networkId: this.networkId,
      difficulty: this.difficulty,
      security: {
        ipfsAnchoredBlocks,
        signedBlocks,
        ipfsAnchorPercentage: totalBlocks > 0 ? ((ipfsAnchoredBlocks / totalBlocks) * 100).toFixed(2) : 0,
        signaturePercentage: totalBlocks > 0 ? ((signedBlocks / totalBlocks) * 100).toFixed(2) : 0
      }
    };
  }
}

module.exports = new Blockchain();

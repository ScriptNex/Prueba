export const CLUSTER_CONFIG = {
    port: parseInt(process.env.PORT || '3000'),
    nodes: [],
    secret: process.env.CLUSTER_SECRET || 'soblend_secret_123',
    nodeId: process.env.NODE_ID || 'main-node',
    role: process.env.NODE_ROLE || 'main'
};

export default CLUSTER_CONFIG;

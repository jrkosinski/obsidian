export const polyEscrow = {
    abi: [
        {
            inputs: [
                {
                    internalType: 'contract ISecurityContext',
                    name: 'securityContext',
                    type: 'address',
                },
                {
                    internalType: 'contract ISystemSettings',
                    name: 'systemSettings',
                    type: 'address',
                },
                {
                    internalType: 'contract IArbitrationModule',
                    name: 'arbitrationModule',
                    type: 'address',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'constructor',
        },
        {
            inputs: [
                {
                    internalType: 'uint256',
                    name: 'x',
                    type: 'uint256',
                },
                {
                    internalType: 'uint256',
                    name: 'y',
                    type: 'uint256',
                },
                {
                    internalType: 'uint256',
                    name: 'denominator',
                    type: 'uint256',
                },
            ],
            name: 'PRBMath__MulDivOverflow',
            type: 'error',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'roleId',
                    type: 'bytes32',
                },
                {
                    internalType: 'address',
                    name: 'addr',
                    type: 'address',
                },
            ],
            name: 'UnauthorizedAccess',
            type: 'error',
        },
        {
            inputs: [],
            name: 'ZeroAddressArgument',
            type: 'error',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
            ],
            name: 'EscrowCreated',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'EscrowFullyPaid',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'EscrowRefunded',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'fee',
                    type: 'uint256',
                },
            ],
            name: 'EscrowReleased',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    indexed: false,
                    internalType: 'address',
                    name: 'from',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'PaymentReceived',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    indexed: false,
                    internalType: 'address',
                    name: 'currency',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'PaymentTransferFailed',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'PaymentTransferred',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'relayAddress',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
            ],
            name: 'RelayNodeDeployed',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    indexed: false,
                    internalType: 'address',
                    name: 'assentingAddress',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'enum ReleaseAssentType',
                    name: 'assentType',
                    type: 'uint8',
                },
            ],
            name: 'ReleaseAssentGiven',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'caller',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'securityContext',
                    type: 'address',
                },
            ],
            name: 'SecurityContextSet',
            type: 'event',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'bytes32',
                            name: 'id',
                            type: 'bytes32',
                        },
                        {
                            internalType: 'address',
                            name: 'payer',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'receiver',
                            type: 'address',
                        },
                        {
                            internalType: 'address[]',
                            name: 'arbiters',
                            type: 'address[]',
                        },
                        {
                            internalType: 'uint8',
                            name: 'quorum',
                            type: 'uint8',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                        {
                            internalType: 'address',
                            name: 'currency',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'startTime',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'endTime',
                            type: 'uint256',
                        },
                        {
                            internalType: 'contract IArbitrationModule',
                            name: 'arbitrationModule',
                            type: 'address',
                        },
                    ],
                    internalType: 'struct CreateEscrowInput',
                    name: 'input',
                    type: 'tuple',
                },
            ],
            name: 'createEscrow',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [],
            name: 'defaultArbitrationModule',
            outputs: [
                {
                    internalType: 'contract IArbitrationModule',
                    name: '',
                    type: 'address',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    internalType: 'bool',
                    name: 'autoForwardNative',
                    type: 'bool',
                },
            ],
            name: 'deployRelayNode',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
            ],
            name: 'executeArbitrationProposal',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
            ],
            name: 'getEscrow',
            outputs: [
                {
                    components: [
                        {
                            internalType: 'bytes32',
                            name: 'id',
                            type: 'bytes32',
                        },
                        {
                            internalType: 'address',
                            name: 'payer',
                            type: 'address',
                        },
                        {
                            internalType: 'address',
                            name: 'receiver',
                            type: 'address',
                        },
                        {
                            internalType: 'address[]',
                            name: 'arbiters',
                            type: 'address[]',
                        },
                        {
                            internalType: 'uint8',
                            name: 'quorum',
                            type: 'uint8',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                        {
                            internalType: 'address',
                            name: 'currency',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amountRefunded',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amountReleased',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amountPaid',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'timestamp',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'startTime',
                            type: 'uint256',
                        },
                        {
                            internalType: 'uint256',
                            name: 'endTime',
                            type: 'uint256',
                        },
                        {
                            internalType: 'enum EscrowStatus',
                            name: 'status',
                            type: 'uint8',
                        },
                        {
                            internalType: 'bool',
                            name: 'fullyPaid',
                            type: 'bool',
                        },
                        {
                            internalType: 'bool',
                            name: 'payerReleased',
                            type: 'bool',
                        },
                        {
                            internalType: 'bool',
                            name: 'receiverReleased',
                            type: 'bool',
                        },
                        {
                            internalType: 'bool',
                            name: 'released',
                            type: 'bool',
                        },
                        {
                            internalType: 'contract IArbitrationModule',
                            name: 'arbitrationModule',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'feeBps',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct Escrow',
                    name: '',
                    type: 'tuple',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'getSecurityContext',
            outputs: [
                {
                    internalType: 'contract ISecurityContext',
                    name: '',
                    type: 'address',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
            ],
            name: 'hasEscrow',
            outputs: [
                {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'pause',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [],
            name: 'paused',
            outputs: [
                {
                    internalType: 'bool',
                    name: '',
                    type: 'bool',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        {
                            internalType: 'bytes32',
                            name: 'escrowId',
                            type: 'bytes32',
                        },
                        {
                            internalType: 'address',
                            name: 'currency',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct PaymentInput',
                    name: 'paymentInput',
                    type: 'tuple',
                },
            ],
            name: 'placePayment',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    internalType: 'uint256',
                    name: 'amount',
                    type: 'uint256',
                },
            ],
            name: 'refund',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
            ],
            name: 'releaseEscrow',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [],
            name: 'securityContext',
            outputs: [
                {
                    internalType: 'contract ISecurityContext',
                    name: '',
                    type: 'address',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'escrowId',
                    type: 'bytes32',
                },
                {
                    internalType: 'bool',
                    name: 'state',
                    type: 'bool',
                },
            ],
            name: 'setArbitration',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'contract ISecurityContext',
                    name: '_securityContext',
                    type: 'address',
                },
            ],
            name: 'setSecurityContext',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [],
            name: 'settings',
            outputs: [
                {
                    internalType: 'contract ISystemSettings',
                    name: '',
                    type: 'address',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'unpause',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
    ],
};

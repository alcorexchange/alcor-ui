export const abi = JSON.parse(`
{
  "version": "eosio::abi/1.2",
  "types": [],
  "structs": [{
      "name": "swap",
      "base": "",
      "fields": [{
          "name": "poolId",
          "type": "uint64"
        },{
          "name": "aForB",
          "type": "bool"
        },{
          "name": "amountSpecified",
          "type": "int64"
        },{
          "name": "sqrtPriceLimitX64",
          "type": "uint128"
        }
      ]
    },{
      "name": "swapexactin",
      "base": "",
      "fields": [{
          "name": "inToken",
          "type": "extended_asset"
        },{
          "name": "outToken",
          "type": "extended_asset"
        },{
          "name": "poolIds",
          "type": "uint64[]"
        }
      ]
    },{
      "name": "swapexactout",
      "base": "",
      "fields": [{
          "name": "inToken",
          "type": "extended_asset"
        },{
          "name": "outToken",
          "type": "extended_asset"
        },{
          "name": "poolIds",
          "type": "uint64[]"
        }
      ]
    },{
      "name": "tuple_int64_int64",
      "base": "",
      "fields": [{
          "name": "field_0",
          "type": "int64"
        },{
          "name": "field_1",
          "type": "int64"
        }
      ]
    }
  ],
  "actions": [{
      "name": "swap",
      "type": "swap",
      "ricardian_contract": ""
    },{
      "name": "swapexactin",
      "type": "swapexactin",
      "ricardian_contract": ""
    },{
      "name": "swapexactout",
      "type": "swapexactout",
      "ricardian_contract": ""
    }
  ],
  "tables": [],
  "ricardian_clauses": [],
  "error_messages": [],
  "abi_extensions": [],
  "variants": [],
  "action_results": [{
      "name": "swap",
      "result_type": "tuple_int64_int64"
    },{
      "name": "swapexactin",
      "result_type": "extended_asset"
    },{
      "name": "swapexactout",
      "result_type": "extended_asset"
    }
  ]
}`)

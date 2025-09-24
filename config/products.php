<?php

return [
    'table' => 'item',
    'primary_key' => 'ITEMID', // 👈 dynamic identifier

    'fields' => [
        'ITEMID',
        'ITEM_NAME',
        'PRICE'
    ],

    'editable' => [
        /* 'ITEMID', */
        'ITEM_NAME',
        'PRICE',
    ],

    'validations' => [
        'ITEMID' => 'required|string|max:191',
        'ITEM_NAME' => 'required|string|max:100',
        'PRICE' => 'required|string|max:10'
    ],

    'inputs' => [
        'ITEMID' => 'text',
        'ITEM_NAME' => 'text',
        'PRICE' => 'text'
    ],
];

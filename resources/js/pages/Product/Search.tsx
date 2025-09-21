import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ProductSearch() {
    const { data, setData, post } = useForm({ code: '' });

    return (
        <AppLayout>
            <div className="p-6">
                <h1>Search Product</h1>
                <form onSubmit={e => { e.preventDefault(); post('/product/search'); }}>
                    <input type="text" placeholder="Product Code" value={data.code}
                        onChange={e => setData('code', e.target.value)} />
                    <button type="submit">Search</button>
                </form>
            </div>
        </AppLayout>
    );
}


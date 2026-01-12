import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { DollarSign } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome to Pricer">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
                {/* Title */}
                <div className="mb-12 flex items-center gap-3">
                    <DollarSign className="h-10 w-10 text-blue-600 dark:text-blue-500" />
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
                        Pricer
                    </h1>
                </div>

                {/* Buttons */}
                <div className="w-full max-w-xs space-y-4">
                    {auth.user ? (
                        <Link
                            href={dashboard()}
                            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-medium text-white hover:bg-blue-700 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href={register()}
                                className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 text-center font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Create Account
                            </Link>
                        </>
                    )}
                </div>

                {/* Simple Footer */}
                <p className="mt-12 text-sm text-gray-500 dark:text-gray-400">
                    Field Editor
                </p>
            </div>
        </>
    );
}

<?php

/**
 * PHPCS bootstrap file.
 *
 * Loaded via `php -d auto_prepend_file=phpcs-bootstrap.php` so it runs
 * before the Composer autoloader. Stubs Magento framework classes that are
 * required by module registration.php files but are unavailable when running
 * PHPCS outside a full Magento installation.
 */

declare(strict_types=1);

namespace Magento\Framework\Component {
    if (!class_exists(\Magento\Framework\Component\ComponentRegistrar::class, false)) {
        class ComponentRegistrar
        {
            public const MODULE   = 'Module';
            public const LIBRARY  = 'Library';
            public const THEME    = 'Theme';
            public const LANGUAGE = 'Language';

            // phpcs:ignore Magento2.Functions.StaticFunction
            public static function register(string $type, string $componentName, string $path): void
            {
                // no-op stub for static analysis tooling
            }
        }
    }
}

namespace {
    // Restore global namespace for any subsequent includes.
}


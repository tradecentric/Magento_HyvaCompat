<?php
declare(strict_types=1);

namespace Punchout2Go\HyvaCompat\Model\Transfer\QuoteDataHandlers;

use Punchout2Go\Punchout\Model\Transfer\QuoteDataHandlerInterface;
use TradeCentric\Version\Api\ModuleHelperInterface;

/**
 * Class Version
 * @package Punchout2Go\HyvaCompat\Model\Transfer\QuoteDataHandlers
 */
class Version implements QuoteDataHandlerInterface
{
    /**
     * @var ModuleHelperInterface
     */
    protected $helper;

    /**
     * @var \Punchout2Go\Punchout\Api\LoggerInterface
     */
    protected $logger;

    /**
     * @param ModuleHelperInterface $helper
     */
    public function __construct(ModuleHelperInterface $helper, \Punchout2Go\Punchout\Api\LoggerInterface $logger,)
    {
        $this->helper = $helper;
        $this->logger = $logger;
    }

    /**
     * @param \Magento\Quote\Api\Data\CartInterface $cart
     * @return mixed[]
     */
    public function handle(\Magento\Quote\Api\Data\CartInterface $cart): array
    {
        return [
            'custom_fields' => [
                [
                    'field' => 'hyva_compat_extension',
                    'value' => $this->helper->getModuleVersion()
                ]
            ]
        ];
    }
}

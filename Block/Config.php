<?php
namespace Punchout2Go\HyvaCompat\Block;

use Magento\Framework\View\Element\Template;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Store\Model\ScopeInterface;

class Config extends Template
{
    const XML_PATH_REST_STORE_CODE = 'punchout2go_punchout/hyvacompat/rest_store_code';
    const XML_PATH_API_KEY_OVERRIDE = 'punchout2go_punchout/hyvacompat/api_key';
    const XML_PATH_API_KEY_ORIGINAL = 'punchout2go_punchout/general/api_key';

    protected $scopeConfig;

    public function __construct(
        Template\Context $context,
        ScopeConfigInterface $scopeConfig,
        array $data = []
    ) {
        $this->scopeConfig = $scopeConfig;
        parent::__construct($context, $data);
    }

    public function getRestStoreCode(): string
    {
        return (string)$this->scopeConfig->getValue(self::XML_PATH_REST_STORE_CODE, ScopeInterface::SCOPE_STORE) ?: '';
    }

    public function getApiKey(): string
    {
        $override = (string)$this->scopeConfig->getValue(self::XML_PATH_API_KEY_OVERRIDE, ScopeInterface::SCOPE_STORE);
        if ($override) return $override;
        $orig = (string)$this->scopeConfig->getValue(self::XML_PATH_API_KEY_ORIGINAL, ScopeInterface::SCOPE_STORE);
        return $orig ?: '';
    }

    public function getClosePostUrl(): string
    {
        return $this->getUrl('punchout/session/closePost');
    }
}

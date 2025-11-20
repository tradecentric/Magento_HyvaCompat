<?php
declare(strict_types=1);

namespace Punchout2Go\HyvaCompat\Plugin;

use Magento\Framework\Event\Observer;

class LayoutObserverPlugin
{
    /**
     * @var \Punchout2Go\Punchout\Helper\Data
     */
    protected $dataHelper;

    /**
     * @var \Punchout2Go\Punchout\Model\Session
     */
    protected $session;

    /**
     * LayoutObserverPlugin constructor.
     * @param \Punchout2Go\Punchout\Helper\Data $dataHelper
     * @param \Punchout2Go\Punchout\Model\Session $session
     */
    public function __construct(
        \Punchout2Go\Punchout\Helper\Data $dataHelper,
        \Punchout2Go\Punchout\Model\Session $session
    ) {
        $this->dataHelper = $dataHelper;
        $this->session = $session;
    }
    
    public function afterExecute($subject, $result, Observer $observer)
    {
        /** @var Merge $layoutUpdate */
        if ($this->dataHelper->isPunchoutActive() && $this->session->isValid()) {
            $layoutUpdate = $observer->getLayout()->getUpdate();
            $layoutUpdate->addHandle('punchout_close');
        }
        return $result;
    }
}
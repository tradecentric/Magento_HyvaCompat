<?php
declare(strict_types=1);

namespace Punchout2Go\HyvaCompat\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\View\Model\Layout\Merge;

/**
 * Class LayoutObserver
 * @package Punchout2Go\Punchout\Observer
 */
class LayoutObserver extends \Punchout2Go\Punchout\Observer\LayoutObserver implements ObserverInterface
{
    /**
     * @param Observer $observer
     */
    public function execute(Observer $observer)
    {
        /** @var Merge $layoutUpdate */
        $layoutUpdate = $observer->getLayout()->getUpdate();
        $isActive = $this->helper->isPunchoutActive();
        if ($isActive && $this->session->isValid()) {
 //           $layoutUpdate->addHandle('punchout');
        }

        if ($isActive && $this->session->isValid()) {
            if ($observer->getFullActionName() == 'checkout_cart_index') {
                $layoutUpdate->addHandle('punchout_checkout_cart_index');
            }

            $this->pageConfig->addBodyClass('is-punchout-session');
        }
    }
}

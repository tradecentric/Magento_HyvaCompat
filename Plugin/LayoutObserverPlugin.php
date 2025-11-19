<?php
declare(strict_types=1);

namespace Punchout2Go\HyvaCompat\Plugin;

use Magento\Framework\Event\Observer;

class LayoutObserverPlugin
{
    public function afterExecute($subject, $result, Observer $observer)
    {
		/** @var Merge $layoutUpdate */
        $layoutUpdate = $observer->getLayout()->getUpdate();
//        $isActive = $this->helper->isPunchoutActive();
//        if ($isActive) {
            $layoutUpdate->addHandle('punchout_close');
//        }
	echo 'test: ' . var_dump($observer);
        return $result;
    }
}

import WalletMultiButton from './wallet-multi-button'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import { Tooltip } from '@nextui-org/react'
import Image from 'next/image'
import Logo from '../public/IBCM.png'

export function NavBar() {
  return (
    <Navbar maxWidth="lg">
            {/* </Tooltip> */}
                  {/* </Tooltip> */}
      <NavbarBrand>
        
         {/* </Tooltip> */}
        <Image src={Logo} alt="IBC Logo" width={150} />
         {/* </Tooltip> */}
                  {/* </Tooltip> */}
      </NavbarBrand>
           
      <NavbarContent justify="end">
        {/* <Tooltip placement="bottom" content="Devnet Only"> */}
        <NavbarItem>
          <WalletMultiButton />
        </NavbarItem>
        {/* </Tooltip> */}
      </NavbarContent>
    </Navbar>
  )
}

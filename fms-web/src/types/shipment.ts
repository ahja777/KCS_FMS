export interface Customer {
  customer_id: number;
  customer_cd: string;
  customer_name: string;
  customer_type: string;
}

export interface Carrier {
  carrier_id: number;
  carrier_cd: string;
  carrier_name: string;
  carrier_type: 'SEA' | 'AIR';
}

export interface Port {
  port_cd: string;
  port_name: string;
  country_cd: string;
  port_type: 'SEA' | 'AIR';
}

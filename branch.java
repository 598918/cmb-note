package com.cmb.bus.common.util;

import java.sql.Date;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTableR;
import com.frm.base.util.StringUtil;
import com.frm.container.loader.ContainerFactory;

/**
 * 机构工具<br>
 * 	依赖缓存： CFG.Q2CFCOBR<br>
 * 
 * @author ho074378
 *
 */
public class Branch {
    /**
     * 机构号 招行银行顶层核心机构号
     */
    public static final String CMBCORNBR = "100";
	
	/**
	 * 机构号 招行银行顶层人事机构号
	 */
    public static final String CMBHRBRN = "50010002";

	/**
	 * 默认机构缓存表
	 * 必须包含字段 BRN_NBR机构编号、BRN_NAM机构名称、UPP_BRN上级机构
	 */
	public static final String CACHETABLE = "CFG.Q2CFCOBR";

	public static final String HRCACHETABLE = "CFG.HRCFBRDA";

	public static final String GROUPCACHETABLE = "SCH.Q2SCGPDA";

	public static final String GROUPBRNCACHETABLE = "SCH.Q2SCGPBR";
	
	public static final String CACHETABLEEXT = "CFG.Q2CFCOBR_EXT";
	
	
    
	 /**
     * 获取机构名称 <br>
     * 
     * @param brnNbr 机构编码
     * @return
     * @throws FrameworkException
     */
	public static String getName(String brnNbr) throws FrameworkException {
        return getName(CACHETABLE, brnNbr);
    }

	/**
	 * 获取机构全名
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static String getAllName(String brnNbr) throws FrameworkException {
        return brnNbr + " " + getName(brnNbr);
    }

	/**
	 * 使用指定缓存单元，获取机构名称
	 * @param cacheTable
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static String getName(String cacheTable, String brnNbr) throws FrameworkException {
        if (StringUtil.isEmpty(brnNbr)) {
            return "";
        }
        
        if(isGroup(brnNbr)){
        	return getGroupName(brnNbr);
        }
        
        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(cacheTable);
        if(corBrnTable == null){
        	return "";
        }
        
        String name = "";

        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);
        if (null != rowIdList && rowIdList.size() > 0) {
            name = corBrnTable.getString(rowIdList.get(0), "BRN_NAM");
        }
        
        return name;
	}

	/**
	 * 获取机构全名
	 * @param cacheTable
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static String getAllName(String cacheTable, String brnNbr) throws FrameworkException {
        return brnNbr + " " + getName(cacheTable, brnNbr);
	}

    /**
     * 获取上级机构
     * 
     * @param brnNbr
     * @return
     * @throws FrameworkException
     */
	public static String getParent(String brnNbr) throws FrameworkException {
		return getParent(CACHETABLE, brnNbr);
	}

	/**
	 * 使用指定缓存单元，获取上级机构
	 * @param cacheTable
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static String getParent(String cacheTable, String brnNbr) throws FrameworkException {
		if (StringUtil.isEmpty(brnNbr)) {
			return null;
		}
		ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(cacheTable);

		if(corBrnTable == null){
			return null;
		}
		
		List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);

		if (rowIdList != null && rowIdList.size() > 0) {
			return corBrnTable.getString(rowIdList.get(0), "UPP_BRN");
		}

		return null;
	}

	/**
     * 获取所有上级机构（含自身）（有序）
     * 
     * @param brnNbr
     * @return
     * @throws FrameworkException
     */
    public static String[] getParents(String brnNbr) throws FrameworkException {
        return getParents(CACHETABLE, brnNbr);
    }

    /**
     * 使用指定缓存单元，获取所有上级机构（含自身）（有序）
     * @param cacheTable
     * @param brnNbr
     * @return
     * @throws FrameworkException
     */
    public static String[] getParents(String cacheTable, String brnNbr) throws FrameworkException {
        if (StringUtil.isEmpty(brnNbr)) {
            return null;
        }

        List<String> list = new ArrayList<String>();

		ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(cacheTable);
		if(corBrnTable == null){
	        return new String[0];
		}
		
        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);

        while (rowIdList != null && rowIdList.size() > 0) {
            String _brnNbr = corBrnTable.getString(rowIdList.get(0), "BRN_NBR");
            String _uppBrn = corBrnTable.getString(rowIdList.get(0), "UPP_BRN");
            list.add(_brnNbr);
            rowIdList = corBrnTable.select("BRN_NBR", _uppBrn);
        }

        return list.toArray(new String[0]);
    }
	
	/**
	 * 获取自身及所有上级机构（无序）
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static Set<String> getParentSet(String cacheTable, String brnNbr) throws FrameworkException {
		if(StringUtil.isEmpty(brnNbr)){
			return null;
		}
		
		Set<String> set = new HashSet<String>();

		ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(cacheTable);
		if(corBrnTable == null){
			return set;
		}
		
        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);

        while (rowIdList != null && rowIdList.size() > 0) {
            String _brnNbr = corBrnTable.getString(rowIdList.get(0), "BRN_NBR");
            String _uppBrn = corBrnTable.getString(rowIdList.get(0), "UPP_BRN");
            set.add(_brnNbr);
            rowIdList = corBrnTable.select("BRN_NBR", _uppBrn);
        }
		
		return set;
	}
	
	/**
	 * 获取自身及所有上级机构（无序）
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static Set<String> getParentSet(String brnNbr) throws FrameworkException {
		return getParentSet(CACHETABLE, brnNbr);
	}

    /**
     * 获取机构下所有机构（含自身）
     * 
     * @param brnNbr 机构编码 （顶层机构以下级别）
     * @return
     * @throws FrameworkException
     */
    public static Set<String> getChildrens(String brnNbr) throws FrameworkException {
        return getChildrens(CACHETABLE, brnNbr);
    }

    /**
     * 使用指定缓存单元，获取机构下所有机构（含自身）
     * @param cacheTable
     * @param brnNbr
     * @return
     * @throws FrameworkException
     */
    public static Set<String> getChildrens(String cacheTable, String brnNbr) throws FrameworkException {
        Set<String> set = new HashSet<String>();
		if (StringUtil.isEmpty(brnNbr)){
			return set;
		}

		if(isGroup(brnNbr)){
			set = getGroupBrn(brnNbr);
			set.add(brnNbr);
		}else{
			ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(cacheTable);
			if(corBrnTable != null){
				getChildrens(brnNbr, set, corBrnTable);
			}
		}

        return set;
    }
    
    /**
     * 获取指定机构A下的所有机构
     * 
     * @param brnNbr
     * @param brnSet
     * @param corBrnTable
     * @throws FrameworkException
     */
    private static void getChildrens(String brnNbr, final Set<String> brnSet, ICacheTableR corBrnTable) throws FrameworkException {
        brnSet.add(brnNbr);
        List<Integer> rowIdList = corBrnTable.select("UPP_BRN", brnNbr);
        if (null != rowIdList && rowIdList.size() > 0) {
            for (Integer rowId : rowIdList) {
                getChildrens(corBrnTable.getString(rowId, "BRN_NBR"), brnSet, corBrnTable);
            }
        }
    }
    
    /**
     * 判断child机构是否属于parent机构的下属（相等也算）
     * 
     * @param parentBrn 父机构B
     * @param childBrn 子机构A
     * @return
     * @throws FrameworkException
     */
    public static boolean isBelong(String parentBrn, String childBrn) throws FrameworkException {
        return isBelong(CACHETABLE, parentBrn, childBrn);
    }

    /**
     * 使用指定缓存单元，判断child机构是否属于parent机构的下属（相等也算）
     * @param cacheName
     * @param parentBrn
     * @param childBrn
     * @return
     * @throws FrameworkException
     */
    public static boolean isBelong(String cacheName, String parentBrn, String childBrn) throws FrameworkException {
		if (StringUtil.isEmpty(childBrn) || StringUtil.isEmpty(parentBrn)) {
			return false;
		}
		
		if (childBrn.equals(parentBrn)) {
			return true;
		}
		
		if(isGroup(parentBrn) && !isGroup(childBrn)){
			//父机构为排班组，子机构非排班组：取出子机构所属排班组，判断与父机构是否相同
			//注意：排班组下属支行，不自动将支行的下属二级支行归纳到排班组
			String grpNbr = getGroup(childBrn);
			if (parentBrn.equals(grpNbr)) {
				return true;
			}
		}else if(!isGroup(parentBrn) && isGroup(childBrn)){
			//子机构为排班组，父机构非排班组：取出子机构所属分行，判断是否在父机构范围之内
			String bbkNbr = getBbkNbr(childBrn);
			return isBelong(cacheName, parentBrn, bbkNbr);
		}else if(isGroup(parentBrn) && isGroup(childBrn)){
			//均为排班组，返回false，因为前面已判断是否相等
			return false;
		}else{
			ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(cacheName);
			if(corBrnTable == null){
				return false;
			}
			
	        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", childBrn);

	        if (null == rowIdList || rowIdList.size() == 0) {
	            return false;
	        }
	        String corBrn = corBrnTable.getString(rowIdList.get(0), "UPP_BRN");

	        return isBelong(cacheName, parentBrn, corBrn);
		}
		
		return false;
    }
    

	/**
	 * 判断是否排班组
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static boolean isGroup(String brnNbr) throws FrameworkException {
		if(!StringUtil.isEmpty(brnNbr) && brnNbr.trim().length() == 6 && brnNbr.startsWith("G")){
			return true;
		}
		return false;
	}
	
	/**
	 * 获取机构所属排班组
	 * 
	 * @param brnNbr 支行机构号
	 * @return
	 * @throws FrameworkException
	 */
	public static String getGroup(String brnNbr) throws FrameworkException {
        if (StringUtil.isEmpty(brnNbr)) {
            return "";
        }
        
        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(GROUPBRNCACHETABLE);
		if(corBrnTable == null){
			return "";
		}

        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);
        if (null != rowIdList && rowIdList.size() > 0) {
            return corBrnTable.getString(rowIdList.get(0), "GRP_NBR");
        }
        
        return "";
	}

	 /**
    * 获取排班组名称 <br>
    * 
    * @param grpNbr
    * @return
    * @throws FrameworkException
    */
	public static String getGroupName(String grpNbr) throws FrameworkException {
        if (StringUtil.isEmpty(grpNbr)) {
            return "";
        }
        
        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(GROUPCACHETABLE);
		if(corBrnTable == null){
			return "";
		}
		
        String name = "";

        List<Integer> rowIdList = corBrnTable.select("GRP_NBR", grpNbr);
        if (null != rowIdList && rowIdList.size() > 0) {
            String val = corBrnTable.getString(rowIdList.get(0), "GRP_NAM");
            String sts = corBrnTable.getString(rowIdList.get(0), "GRP_STS");
			if (null != val && null != sts && "A".equals(sts)) {
				name = val;
			}
        }
        
        return name;
	}
	
	/**
	 * 查询排班组下属支行（不自动计算二级支行）
	 * @param grpNbr 排班组编号
	 * @return
	 * @throws FrameworkException
	 */
	public static Set<String> getGroupBrn(String grpNbr) throws FrameworkException {
		Set<String> set = new HashSet<String>();
		
		if(isGroup(grpNbr)){
	        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(GROUPBRNCACHETABLE);
			if(corBrnTable == null){
				return set;
			}

	        List<Integer> rowIdList = corBrnTable.select("GRP_NBR", grpNbr);
	        if (null != rowIdList && rowIdList.size() > 0) {
	            for (Integer rowId : rowIdList) {
	            	set.add(corBrnTable.getString(rowId, "BRN_NBR"));
	            }
	        }
		}
			
		return set;
	}


	/**
	 * 判断是否支行
	 * @param application
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static boolean isBrnNbr(String brnNbr) throws FrameworkException {
		if(StringUtil.isEmpty(brnNbr) || brnNbr.length() != 6 || isGroup(brnNbr)){
			return false;
		}
		
        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(CACHETABLE);
		if(corBrnTable == null){
			return false;
		}

        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);
        if (null != rowIdList && rowIdList.size() > 0) {
        	String val = corBrnTable.getString(rowIdList.get(0), "BRN_TYP");
			if (!StringUtil.isEmpty(val) && val.equals("B")) {
				return true;
			}
        }
		
		return false;
	}

	/**
	 * 是否分行（基层）
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static boolean isBbkNbr(String brnNbr) throws FrameworkException {
		if(!StringUtil.isEmpty(brnNbr) && !brnNbr.trim().equals(CMBCORNBR) && brnNbr.trim().length() == 3){
			return true;
		}
		return false;
	}

	/**
	 * 获取指定机构的上级分行（基层）<br>
	 * 支持排班组
	 * 
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static String getBbkNbr(String brnNbr) throws FrameworkException {
		if (null == brnNbr || brnNbr.trim().length() != 6) {
			return brnNbr;
		}

		if(isGroup(brnNbr)){
	        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(GROUPCACHETABLE);
			if(corBrnTable == null){
				return "";
			}
			
	        List<Integer> rowIdList = corBrnTable.select("GRP_NBR", brnNbr);
	        
	        if (null != rowIdList && rowIdList.size() > 0) {
	            return corBrnTable.getString(rowIdList.get(0), "BBK_NBR");
	        }
		}else{
			ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(CACHETABLE);
			if(corBrnTable == null){
				return "";
			}
			
	        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);

	        while (rowIdList != null && rowIdList.size() > 0) {
	            String _uppBrn = corBrnTable.getString(rowIdList.get(0), "UPP_BRN");
	            if(isBbkNbr(_uppBrn)){
	            	return _uppBrn;
	            }
	            rowIdList = corBrnTable.select("BRN_NBR", _uppBrn);
	        }
		}

		return "";
	}

	/**
	 * 获取分行下的所有分行（含自身）
	 * @param brnNbr
	 * @throws FrameworkException
	 */
	public static Set<String> getSubBbkNbrs(String brnNbr) throws FrameworkException {
		Set<String> set = new HashSet<String>();
		
		Set<String> brnListSet = getChildrens(brnNbr);
		for(String brn: brnListSet){
			if(isBbkNbr(brn)){
				set.add(brn);
			}
		}
		return set;
	}

	/**
	 * 获取所有一级分行
	 * @param brnNbr
	 * @throws FrameworkException
	 */
	public static Set<String> getSubTopBbks(String brnNbr) throws FrameworkException {
		Set<String> set = new HashSet<String>();
		
		Set<String> brnListSet = getChildrens(brnNbr);

        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(CACHETABLE);
		if(corBrnTable == null){
			return set;
		}
        
		for(String brn: brnListSet){
			if(isBbkNbr(brn)){
		        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brn);
		        if (null != rowIdList && rowIdList.size() > 0) {
		        	String brnLvl = corBrnTable.getString(rowIdList.get(0), "BRN_LVL");
		        	String brnNam = corBrnTable.getString(rowIdList.get(0), "BRN_NAM");
		        	String brnTyp = corBrnTable.getString(rowIdList.get(0), "BRN_TYP");
		        	if("30".equals(brnLvl) && "B".equals(brnTyp) && brnNam.indexOf("分行") > -1){
						set.add(brn);
		        	}
		        }
			}
		}
		
		return set;
	}

	/**
	 * 获取所有二级分行
	 * @param brnNbr
	 * @throws FrameworkException
	 */
	public static Set<String> getSubBasBbks(String brnNbr) throws FrameworkException {
		Set<String> set = new HashSet<String>();
		if(!isBbkNbr(brnNbr)){
			return set;
		}
		
		Set<String> brnListSet = getChildrens(brnNbr);
        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(CACHETABLE);
		if(corBrnTable == null){
			return set;
		}
        
		for(String brn: brnListSet){
			if(CMBCORNBR.equals(brnNbr) && brn.startsWith("2")){
				continue;
			}
			
			if(isBbkNbr(brn)){
		        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brn);
		        if (null != rowIdList && rowIdList.size() > 0) {
		        	String brnLvl = corBrnTable.getString(rowIdList.get(0), "BRN_LVL");
		        	String brnNam = corBrnTable.getString(rowIdList.get(0), "BRN_NAM");
		        	String brnTyp = corBrnTable.getString(rowIdList.get(0), "BRN_TYP");
		        	if(("30".equals(brnLvl) || "50".equals(brnLvl)) && "B".equals(brnTyp) && brnNam.indexOf("分行") > -1){
						set.add(brn);
		        	}
		        }
			}
		}
		
		return set;
	}
	
	/**
	 * 获取分行下所有同城支行
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static Set<String> getSubLocBrns(String brnNbr) throws FrameworkException {
		Set<String> set = new HashSet<String>();
		if(!isBbkNbr(brnNbr)){
			return set;
		}
		
		Set<String> brnListSet = getChildrens(brnNbr);
		for(String brn: brnListSet){
			if(CMBCORNBR.equals(brnNbr) && brn.startsWith("2")){
				continue;
			}
			
			if(isBrnNbr(brn) && brn.startsWith(brnNbr)){
				set.add(brn);
			}
		}
		
		return set;
	}
	
	/**
	 * 获取分行下所有支行
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static Set<String> getSubAllBrns(String brnNbr) throws FrameworkException {
		Set<String> set = new HashSet<String>();
		if(!isBbkNbr(brnNbr)){
			return set;
		}
		
		Set<String> brnListSet = getChildrens(brnNbr);
		for(String brn: brnListSet){
			if(CMBCORNBR.equals(brnNbr) && brn.startsWith("2")){
				continue;
			}
			
			if(isBrnNbr(brn)){
				set.add(brn);
			}
		}
		
		return set;
	}

	/**
	 * 查询分行下的排班组（自动计算二级分行）
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static Set<String> getSubGroupsByBbkAll(String brnNbr) throws FrameworkException {
		Set<String> set = new HashSet<String>();

		//获取分行下所有排班组，含二级分行
		Set<String> bbkListSet = getSubBbkNbrs(brnNbr);
		for(String brn: bbkListSet){
			set.addAll(getSubGroupsByBbk(brn));
		}
			
		return set;
	}

	/**
	 * 查询分行下的排班组（不自动计算二级分行）
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static Set<String> getSubGroupsByBbk(String brnNbr) throws FrameworkException {
		Set<String> set = new HashSet<String>();

		if(isBbkNbr(brnNbr)){
	        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(GROUPCACHETABLE);
			if(corBrnTable == null){
				return set;
			}

	        List<Integer> rowIdList = corBrnTable.select("BBK_NBR", brnNbr);
	        if (null != rowIdList && rowIdList.size() > 0) {
	            for (Integer rowId : rowIdList) {
	            	String grpSts = corBrnTable.getString(rowId, "GRP_STS");
					if(!"A".equals(grpSts)){
						continue;
					}
					
					String grpNbr = corBrnTable.getString(rowId, "GRP_NBR");
					set.add(grpNbr);
	            }
	        }
		}
			
		return set;
	}
	
	/**
	 * 判断机构是否存在<br>
	 * 支持排班组
	 * 
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static boolean exist(String brnNbr) throws FrameworkException {
		if(!StringUtil.isEmpty(getName(brnNbr))) {
			return true;
		}
		
		return false;
	}

	/**
	 * 获取支行类型
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static String getBrnSty(String brnNbr) throws FrameworkException {
		if (!isBrnNbr(brnNbr)) {
			return "";
		}
        
        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(CACHETABLEEXT);
		if(corBrnTable == null){
			return "";
		}

		List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);
        if (null != rowIdList && rowIdList.size() > 0) {
            return corBrnTable.getString(rowIdList.get(0), "BRN_STY");
        }
        
		return "";
	}
	
	/**
	 * 获取机构开业日期
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static Date getBrnStrDte(String brnNbr) throws FrameworkException {
        if (StringUtil.isEmpty(brnNbr)) {
			return Date.valueOf("1900-01-01");
        }
		
        ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(CACHETABLE);
		Date returnDate = Date.valueOf("1900-01-01");

		if(corBrnTable == null){
			return returnDate;
		}

        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);
        if (null != rowIdList && rowIdList.size() > 0) {
        	returnDate = corBrnTable.getDate(rowIdList.get(0), "STR_DTE");
        }
        
        return returnDate;
	}
	
	/**
	 * 获取指定机构的一级分行
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static String getTopBbkNbr(String brnNbr) throws FrameworkException {
		if (StringUtil.isEmpty(brnNbr)) {
			return "";
		}

		ICacheTableR corBrnTable = ContainerFactory.getContainer().getCacheTable(CACHETABLE);
		if(corBrnTable == null){
			return "";
		}
		
        List<Integer> rowIdList = corBrnTable.select("BRN_NBR", brnNbr);

        while (rowIdList != null && rowIdList.size() > 0) {
            String _uppBrn = corBrnTable.getString(rowIdList.get(0), "UPP_BRN");
            String _brnLvl = corBrnTable.getString(rowIdList.get(0), "BRN_LVL");
            String _brnNbr = corBrnTable.getString(rowIdList.get(0), "BRN_NBR");
            
            if(_brnNbr.trim().equals("102") || _brnLvl.trim().equals("30")){
				return _brnNbr;
			}
            rowIdList = corBrnTable.select("BRN_NBR", _uppBrn);
        }

		return CMBCORNBR;
	}


	/**
	 * 获取人事机构名称
	 * 
	 * @param brnNbr
	 * @return
	 * @throws FrameworkException
	 */
	public static String getHrName(String hrBrn) throws FrameworkException {
		String hrName = "";
        ICacheTableR hrCT = ContainerFactory.getContainer().getCacheTable(HRCACHETABLE);
        if(hrCT == null){
        	return hrName;
        }
        
        List<Integer> rowIdList = hrCT.select("OBJID", hrBrn);
        if (null != rowIdList && rowIdList.size() > 0) {
        	hrName = hrCT.getString(rowIdList.get(0), "STEXT");
        }
        return hrName;
	}
	
    /**
     * 获取人事机构下级机构
     * 
     * @param hrBrn 人事机构编码
     * @return
     * @throws FrameworkException
     */
    public static Set<String> getHrChildrens(String hrBrn) throws FrameworkException {
        Set<String> set = new HashSet<String>();
        if (StringUtil.isEmpty(hrBrn) || CMBHRBRN.equals(hrBrn)){
        	return set;
        }

        ICacheTableR hrCT = ContainerFactory.getContainer().getCacheTable(HRCACHETABLE);
        if(hrCT == null){
        	return set;
        }
        
        getHrChildrens(hrBrn, set, hrCT);
        return set;
    }

    private static void getHrChildrens(String hrBrn, final Set<String> brnSet, ICacheTableR hrCT) throws FrameworkException {
        brnSet.add(hrBrn);
        List<Integer> rowIdList = hrCT.select("SOBID", hrBrn);
        if (null != rowIdList && rowIdList.size() > 0) {
            for (Integer rowId : rowIdList) {
                getHrChildrens(hrCT.getString(rowId, "OBJID"), brnSet, hrCT);
            }
        }
    }
	
	/**
	 * 根据brn_nbr排序
	 * @param brnRows
	 * @throws FrameworkException
	 */
	public static void sortBrn(List<String> brns) {

		Collections.sort(brns, new Comparator<String>() {
			@Override
			public int compare(String o1, String o2) {
				if (null == o1 && null == o2) {
					return 0;
				}
				if (null == o1 && null != o2) {
					return -1;
				}
				if (null != o1 && null == o2) {
					return 1;
				}

				return o1.compareTo(o2);
			}
		});

	}

}
